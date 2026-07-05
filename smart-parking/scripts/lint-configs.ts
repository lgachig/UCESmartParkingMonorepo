import * as fs from 'fs';
import * as path from 'path';

let hasError = false;

function logError(file: string, line: number, message: string) {
  console.error(`❌ [LINT ERROR] ${file}:${line} - ${message}`);
  hasError = true;
}

function getFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git' && file !== 'dist') {
        getFiles(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function lintEnvFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    // Check format
    if (!line.includes('=')) {
      if (line.includes(':')) {
        logError(filePath, lineNum, `Incorrect syntax: environment variable definition should use '=' instead of ':'`);
      } else {
        logError(filePath, lineNum, `Invalid line syntax: missing '='`);
      }
      continue;
    }

    const [key, ...valParts] = line.split('=');
    const value = valParts.join('=').trim().replace(/^['"]|['"]$/g, '');
    const cleanKey = key.trim();

    // Check user service url ends with /api
    if (cleanKey.endsWith('USER_SERVICE_URL') || cleanKey === 'NEXT_PUBLIC_USER_API_URL') {
      if (!value.endsWith('/api')) {
        logError(filePath, lineNum, `${cleanKey} does not end with the mandatory '/api' prefix (value: '${value}')`);
      }
    }

    // Check database URLs point to their expected database
    const expectedDbs: Record<string, string> = {
      'DATABASE_URL': 'smartparking',
      'USER_DATABASE_URL': 'userdb',
      'VEHICLE_DATABASE_URL': 'vehicledb',
      'PARKING_DATABASE_URL': 'parkingdb',
      'RESERVATION_DATABASE_URL': 'reservationdb'
    };
    if (cleanKey in expectedDbs) {
      let dbName = '';
      try {
        const urlObj = new URL(value);
        dbName = urlObj.pathname.slice(1);
      } catch (err) {
        const lastSlash = value.lastIndexOf('/');
        dbName = lastSlash !== -1 ? value.slice(lastSlash + 1).split('?')[0] : '';
      }
      const expected = expectedDbs[cleanKey];
      if (dbName !== expected) {
        logError(filePath, lineNum, `${cleanKey} points to database '${dbName || 'unknown'}' instead of the expected '${expected}'`);
      }
    }
  }
}

interface ServiceInfo {
  name: string;
  ports: string[];
  environment: { key: string; line: number }[];
  volumes: string[];
  line: number;
}

function lintComposeContent(filePath: string, content: string, startLineOffset: number = 0) {
  const lines = content.split('\n');
  const services: ServiceInfo[] = [];
  let currentService: ServiceInfo | null = null;
  let inServicesBlock = false;
  let currentSection: 'ports' | 'environment' | 'volumes' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1 + startLineOffset;
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;

    // Check if entering/exiting services block
    if (indent === 0) {
      if (trimmed.startsWith('services:')) {
        inServicesBlock = true;
      } else {
        inServicesBlock = false;
      }
      currentService = null;
      currentSection = null;
      continue;
    }

    if (inServicesBlock) {
      // Service block header at indent 2
      if (indent === 2 && trimmed.endsWith(':')) {
        const serviceName = trimmed.slice(0, -1).trim();
        currentService = {
          name: serviceName,
          ports: [],
          environment: [],
          volumes: [],
          line: lineNum
        };
        services.push(currentService);
        currentSection = null;

        const validServices = [
          'postgres', 'redis', 'kafka', 'rabbitmq', 'auth-service', 'user-service',
          'vehicle-service', 'parking-service', 'reservation-service',
          'frontend', 'gateway-service', 'payment-service', 'realtime-service', 'app'
        ];
        if (!validServices.includes(serviceName)) {
          logError(filePath, lineNum, `Unknown or invalid service name: '${serviceName}'`);
        }
        continue;
      }

      if (currentService) {
        // Properties/Sections inside service (usually indent 4)
        if (indent === 4 && trimmed.endsWith(':')) {
          const section = trimmed.slice(0, -1).trim();
          if (section === 'ports') {
            currentSection = 'ports';
          } else if (section === 'environment') {
            currentSection = 'environment';
          } else if (section === 'volumes') {
            currentSection = 'volumes';
          } else {
            currentSection = null;
          }
          continue;
        }

        if (indent >= 4) {
          if (indent === 4 && !trimmed.startsWith('-') && !trimmed.endsWith(':')) {
            currentSection = null;
          }

          if (currentSection === 'ports') {
            if (trimmed.startsWith('-')) {
              const portStr = trimmed.slice(1).trim().replace(/['"]/g, '');
              currentService.ports.push(portStr);
              validatePort(filePath, lineNum, currentService.name, portStr);
            } else if (trimmed.startsWith('ports:')) {
              const match = trimmed.match(/\[(.*)\]/);
              if (match) {
                const ports = match[1].split(',').map(p => p.trim().replace(/['"]/g, ''));
                for (const port of ports) {
                  currentService.ports.push(port);
                  validatePort(filePath, lineNum, currentService.name, port);
                }
              }
            }
          } else if (currentSection === 'environment') {
            let envKey = '';
            if (trimmed.startsWith('-')) {
              const pair = trimmed.slice(1).trim();
              envKey = pair.split('=')[0].trim();
            } else if (trimmed.includes(':')) {
              envKey = trimmed.split(':')[0].trim();
            }
            if (envKey) {
              const existing = currentService.environment.find(e => e.key === envKey);
              if (existing) {
                logError(filePath, lineNum, `Duplicate environment variable key '${envKey}' in service '${currentService.name}' (first defined at line ${existing.line})`);
              } else {
                currentService.environment.push({ key: envKey, line: lineNum });
              }
            }
          } else if (currentSection === 'volumes') {
            if (trimmed.startsWith('-')) {
              const volStr = trimmed.slice(1).trim().replace(/['"]/g, '');
              currentService.volumes.push(volStr);
            }
          }
        }
      }
    }
  }

  // Validate volumes across all parsed services
  for (const s of services) {
    if (s.name === 'postgres') {
      const hasPostgresVol = s.volumes.some(v => v.includes('postgres_data:/var/lib/postgresql/data'));
      if (!hasPostgresVol) {
        logError(filePath, s.line, `Postgres service is missing required volume mapping 'postgres_data:/var/lib/postgresql/data'`);
      }
    }
    if (s.name === 'redis') {
      const hasRedisVol = s.volumes.some(v => v.includes('redis_data:/data'));
      if (!hasRedisVol) {
        logError(filePath, s.line, `Redis service is missing required volume mapping 'redis_data:/data'`);
      }
    }
  }
}

function validatePort(filePath: string, line: number, serviceName: string, portStr: string) {
  if (portStr.includes('$')) return; // skip templates
  const parts = portStr.split(':');
  if (parts.length !== 2) return;
  const hostPort = parts[0].trim();

  const expectedHostPorts: Record<string, string> = {
    'postgres': '5432',
    'redis': '6379',
    'kafka': '9092',
    'auth-service': '3000',
    'user-service': '3001',
    'vehicle-service': '3003',
    'parking-service': '3004',
    'reservation-service': '3005',
    'frontend': '3002',
    'gateway-service': '3006',
    'realtime-service': '3008'
  };

  const expected = expectedHostPorts[serviceName];
  if (expected && hostPort !== expected) {
    logError(filePath, line, `Port misalignment: service '${serviceName}' maps host port '${hostPort}' instead of expected '${expected}'`);
  }
}

function lintTemplateFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  const regex = /cat\s*>\s*\/opt\/smartparking\/docker-compose\.yml\s*<<COMPOSE\n([\s\S]*?)\nCOMPOSE/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const blockContent = match[1];
    const preBlock = content.slice(0, match.index);
    const startLine = preBlock.split('\n').length;
    lintComposeContent(filePath, blockContent, startLine);
  }
}

function run() {
  const smartParkingDir = path.resolve(__dirname, '..');
  const rootDir = path.resolve(__dirname, '../..');

  console.log('🔍 Running strict configuration linter...');

  // 1. Lint all .env files recursively
  const allFiles = getFiles(smartParkingDir);
  const envFiles = allFiles.filter(f => path.basename(f).startsWith('.env') || path.extname(f) === '.env');
  console.log(`Checking ${envFiles.length} env file(s)...`);
  for (const envFile of envFiles) {
    lintEnvFile(envFile);
  }

  // 2. Lint root docker-compose
  const rootCompose = path.join(rootDir, 'docker-compose.yml');
  if (fs.existsSync(rootCompose)) {
    console.log('Checking root docker-compose.yml...');
    lintComposeContent(rootCompose, fs.readFileSync(rootCompose, 'utf-8'));
  }

  // 3. Lint EC2 docker-compose
  const ec2Compose = path.join(rootDir, 'infra/ec2/docker-compose.yml');
  if (fs.existsSync(ec2Compose)) {
    console.log('Checking infra/ec2/docker-compose.yml...');
    lintComposeContent(ec2Compose, fs.readFileSync(ec2Compose, 'utf-8'));
  }

  // 4. Lint Terraform templates
  const qaTemplate = path.join(rootDir, 'infra/terraform/environments/qa/templates/user-data.sh.tpl');
  if (fs.existsSync(qaTemplate)) {
    console.log('Checking QA user-data.sh.tpl...');
    lintTemplateFile(qaTemplate);
  }

  const prodTemplate = path.join(rootDir, 'infra/terraform/environments/prod/templates/user-data.sh.tpl');
  if (fs.existsSync(prodTemplate)) {
    console.log('Checking PROD user-data.sh.tpl...');
    lintTemplateFile(prodTemplate);
  }

  if (hasError) {
    console.error('\n❌ Configuration linting FAILED. Fix the issues above to continue.');
    process.exit(1);
  } else {
    console.log('\n✅ All configurations are valid and aligned!');
    process.exit(0);
  }
}

run();