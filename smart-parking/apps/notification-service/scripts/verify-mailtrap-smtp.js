const nodemailer = require('nodemailer');

function mask(value) {
    if (!value) return value;
    const str = String(value);
    if (str.length <= 4) return '*'.repeat(str.length);
    return `${str.slice(0, 2)}${'*'.repeat(str.length - 4)}${str.slice(-2)}`;
}

async function main() {
    const to = process.argv[2] || 'to@example.com';

    const env = {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        SMTP_FROM: process.env.SMTP_FROM,
    };

    console.log('--- Variables SMTP recibidas por el proceso ---');
    console.log({
        SMTP_HOST: env.SMTP_HOST,
        SMTP_PORT: env.SMTP_PORT,
        SMTP_USER: mask(env.SMTP_USER),
        SMTP_PASS: mask(env.SMTP_PASS),
        SMTP_FROM: env.SMTP_FROM,
    });

    const missing = Object.entries(env)
        .filter(([, v]) => v === undefined || v === '')
        .map(([k]) => k);

    if (missing.length > 0) {
        console.error(
            `\n❌ Faltan variables de entorno: ${missing.join(', ')}.\n` +
            'Esto confirma que el proceso NO las está recibiendo: revisa que el ' +
            '.env del contenedor tenga estas keys y que el workflow de CI/CD haga ' +
            'patch_env de SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM para ' +
            'este servicio en ESTE entorno (ojo: en prod.yml notification-service ' +
            'no aparece ni en docker-push ni en deploy, solo en qa.yml).',
        );
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT),
        secure: false,
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
        },
    });

    console.log('\n--- Paso 1: transporter.verify() (handshake + login SMTP) ---');
    try {
        await transporter.verify();
        console.log('✅ Conexión y autenticación SMTP OK.');
    } catch (err) {
        console.error('❌ Falló verify(). Esto es un problema de host/puerto/credenciales:');
        console.error(err);
        process.exit(1);
    }

    console.log('\n--- Paso 2: enviando correo de prueba ---');
    try {
        const info = await transporter.sendMail({
            from: env.SMTP_FROM,
            to,
            subject: 'Hello from Mailtrap (diagnóstico notification-service)',
            text: 'Este es un correo de prueba enviado desde verify-mailtrap-smtp.js',
        });
        console.log('✅ Message sent:', info.messageId);
    } catch (err) {
        console.error('❌ Falló sendMail(). Detalle completo del error:');
        console.error(err);
        process.exit(1);
    }
}

main();