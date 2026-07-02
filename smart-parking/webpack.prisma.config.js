const { join } = require('path');
const webpack = require('webpack');

const GENERATED_CLIENTS = [
  'auth-client',
  'user-client',
  'vehicle-client',
  'parking-client',
  'reservation-client',
  'payment-client',
];

function isGeneratedClientModule(request) {
  if (!request) {
    return false;
  }

  if (request.startsWith('@generated/')) {
    return true;
  }

  return GENERATED_CLIENTS.some((client) =>
    request.includes(`${join('generated', client)}`),
  );
}

function prismaWebpackExternals(serviceDir) {
  const generatedRoot = join(serviceDir, '../../generated');

  return [
    '@nestjs/terminus',
    '@prisma/client',
    '@prisma/client/runtime/client',
    '@prisma/adapter-pg',
    ({ request }, callback) => {
      if (!isGeneratedClientModule(request)) {
        return callback();
      }

      let resolvedRequest = request;

      if (request.startsWith('@generated/')) {
        resolvedRequest = join(
          generatedRoot,
          request.replace('@generated/', ''),
        );
      }

      return callback(null, `commonjs ${resolvedRequest}`);
    },
  ];
}

function prismaGeneratedClientRule() {
  return {
    test: /[\\/]generated[\\/][^\\/]+-client[\\/]/,
    type: 'javascript/auto',
    resolve: {
      fullySpecified: false,
    },
  };
}

class FixPrismaClientExportsPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      'FixPrismaClientExportsPlugin',
      (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'FixPrismaClientExportsPlugin',
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
          },
          (assets) => {
            for (const [filename, asset] of Object.entries(assets)) {
              if (!filename.endsWith('.js')) {
                continue;
              }

              const source = asset.source().toString();

              if (!source.includes('getPrismaClientClass')) {
                continue;
              }

              const fixed = source
                .replace(
                  '__webpack_exports__.Prisma = __webpack_exports__.PrismaClient = __webpack_exports__.$Enums = void 0;',
                  '__webpack_exports__.Prisma = __webpack_exports__.$Enums = void 0;',
                )
                .replace(
                  'exports.PrismaClient = $Class.getPrismaClientClass();',
                  '__webpack_exports__.PrismaClient = $Class.getPrismaClientClass();',
                )
                .replace(
                  'exports.Prisma = Prisma;',
                  '__webpack_exports__.Prisma = Prisma;',
                )
                .replace(
                  /exports\.\$Enums = tslib_1\.__importStar\(__webpack_require__\((\d+)\)\);/g,
                  '__webpack_exports__.$Enums = tslib_1.__importStar(__webpack_require__($1));',
                )
                .replace(
                  /tslib_1\.__exportStar\(__webpack_require__\((\d+)\), exports\);/g,
                  'tslib_1.__exportStar(__webpack_require__($1), __webpack_exports__);',
                );

              compilation.updateAsset(
                filename,
                new webpack.sources.RawSource(fixed),
              );
            }
          },
        );
      },
    );
  }
}

function prismaWebpackPlugins() {
  return [new FixPrismaClientExportsPlugin()];
}

module.exports = {
  prismaWebpackExternals,
  prismaGeneratedClientRule,
  prismaWebpackPlugins,
};
