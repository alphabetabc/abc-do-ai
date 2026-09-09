// const path = require('path');
// const fs = require('fs');

const enableChineseDb = false;

function readPackage(pkg, context) {
    if (pkg.name === 'oss-noc-shaanxi') {
        pkg.dependencies = {
            ...pkg.dependencies,
            antd: '5.8.4',
            '@babel/plugin-proposal-private-property-in-object': '7.20.5',
            'react-router-dom': '5.2.0',

            ...(enableChineseDb
                ? {
                      '@fedx-bff-web/ssr-core': '0.5.5',
                      '@fedx-bff-web/ssr-utils': '0.5.5',
                      '@fedx-bff/core': '0.2.3',
                      '@midwayjs/session': '3.5.1',
                      '@midwayjs/i18n': '3.5.2',
                  }
                : {
                      '@midwayjs/axios': '3.13.4',
                      '@midwayjs/bootstrap': '3.13.0',
                      '@midwayjs/core': '3.13.0',
                      '@midwayjs/decorator': '3.13.0',
                      '@midwayjs/http-proxy': '3.13.4',
                      '@midwayjs/info': '3.13.4',
                      '@midwayjs/koa': '3.13.4',
                      '@midwayjs/logger': '3.1.2',
                      '@midwayjs/socketio': '3.13.4',
                      '@midwayjs/task': '3.6.0',
                      '@midwayjs/typeorm': '3.13.4',
                      '@midwayjs/upload': '3.13.4',
                      '@midwayjs/validate': '3.13.4',
                  }),
        };

        // Object.keys(pkg.dependencies).forEach((key) => {
        //     if (key.startsWith('@midwayjs')) {
        //         pkg.dependencies[key] = pkg.dependencies[key].replace('^', '');
        //     }
        // });

        pkg.devDependencies = {
            ...pkg.devDependencies,
            // '@midwayjs/mock': '3.10.11',
            '@fedx-bff-web/plugin-ssr-midway': '0.5.5',
            '@fedx-bff-web/plugin-ssr-react': '0.5.11',
            '@fedx-bff-web/ssr-types': '0.5.3',
            'fedx-ssr': '0.5.0',
        };

        context.log(`${pkg.name}`);
    }

    if (pkg.name === '@midwayjs/mock') {
        pkg.devDependencies = {
            ...pkg.devDependencies,
            ...(enableChineseDb ? { '@midwayjs/async-hooks-context-manager': '3.5.1' } : {}),
        };
        context.log(`${pkg.name}`);
    }

    if (pkg.name === '@midwayjs/socketio') {
        pkg.dependencies = {
            ...pkg.dependencies,
            ...(enableChineseDb ? { '@midwayjs/core': '3.5.1' } : {}),
        };
        context.log(`${pkg.name}`);
    }

    if (pkg.name === '@fedx-bff/core') {
        pkg.dependencies = {
            ...pkg.dependencies,
            ...(enableChineseDb
                ? { '@midwayjs/cache': '3.5.1', '@midwayjs/typeorm': '3.5.3', '@midwayjs/core': '3.5.1' }
                : {}),
        };
        context.log(`${pkg.name}`);
    }

    if (pkg.name === '@midwayjs/koa') {
        pkg.dependencies = {
            ...pkg.dependencies,
            ...(enableChineseDb ? { '@midwayjs/session': '3.5.1' } : {}),
        };
        context.log(`${pkg.name}`);
    }

    if (pkg.name === '@midwayjs/validate') {
        pkg.dependencies = {
            ...pkg.dependencies,
            ...(enableChineseDb ? { '@midwayjs/i18n': '3.5.2' } : {}),
        };
        context.log(`${pkg.name}`);
    }

    if (pkg.name === 'babel-preset-react-app') {
        pkg.dependencies = {
            ...pkg.dependencies,
            '@babel/plugin-proposal-private-property-in-object': '7.20.5',
            '@babel/core': '7.20.12',
        };
        context.log(`${pkg.name}`);
    }

    if (pkg.name === '@fedx-bff-web/plugin-ssr-react') {
        pkg.dependencies = {
            ...pkg.dependencies,
            'babel-loader': '8.3.0',
            '@babel/core': '7.20.12',
        };
        context.log(`${pkg.name}`);
    }

    if (pkg.name === '@fedx-web-common/utils') {
        pkg.dependencies = {
            ...pkg.dependencies,
            '@types/lodash-es': '^4.17.6',
        };
        context.log(`[依赖注入]:${pkg.name}`);
    }

    if (pkg.name === 'react-resizable') {
        pkg.dependencies = {
            ...pkg.dependencies,
            'react-draggable': '4.4.6',
        };
    }

    if (['@parcel/config-default', '@plasmohq/parcel-config'].includes(pkg.name)) {
        pkg.dependencies = {
            ...pkg.dependencies,
        };
        context.log(`[依赖注入]:${pkg.name}`);
    }

    if (pkg.name === 'fedx-gis') {
        pkg.dependencies = {
            ...pkg.dependencies,
            cesium: '1.142.0',
        };
        context.log(`[依赖注入]:${pkg.name}`);
    }

    return pkg;
}

// 自定义获取器：将指定包重定向到 .local-deps 下的本地 tarball
// const LOCAL_DEPS_DIR = '.local-deps';

// function createLocalTarballFetcher(pkgId, tarballName) {
//     const tarballPath = path.join(LOCAL_DEPS_DIR, tarballName);
//     return {
//         canFetch: (id) => id === pkgId,
//         fetch: async (cafs, resolution, opts, fetchers) => {
//             const realTarballPath = tarballPath;
//             const logContent = `${new Date().toLocaleString()} -- [本地获取${pkgId}]:${realTarballPath}`;
//             fs.writeFileSync(path.join(LOCAL_DEPS_DIR, 'log.txt'), logContent + '\n', { flag: 'a' });
//             return fetchers.localTarball(cafs, { tarball: 'file:' + realTarballPath }, opts);
//         },
//     };
// }

module.exports = {
    hooks: {
        readPackage,
    },
    // fetchers: [
    //     createLocalTarballFetcher('echarts@5.6.0', 'echarts-5.6.0.tgz'),
    //     createLocalTarballFetcher('ace-builds@1.44.0', 'ace-builds-1.44.0.tgz'),
    //     createLocalTarballFetcher('cesium@1.142.0', 'cesium-1.142.0.tgz'),
    //     createLocalTarballFetcher('cesium@1.143.0', 'cesium-1.142.0.tgz'),
    //     createLocalTarballFetcher('@fedx-3d-studio/r3f@0.1.20', 'r3f-0.1.20.tgz'),
    //     createLocalTarballFetcher('@img/sharp-win32-x64@0.33.5', 'sharp-win32-x64-0.33.5.tgz'),
    //     createLocalTarballFetcher('@cesium/engine@26.1.0', 'cesium-engine-26.1.0.tgz'),
    //     createLocalTarballFetcher('@cesium/widgets@1.1.0', 'cesium-widgets-1.1.0.tgz'),
    //     createLocalTarballFetcher('@parcel/transformer-js@2.9.3', 'parcel-transformer-js-2.9.3.tgz'),
    //     createLocalTarballFetcher('@types/three@0.185.0', 'types-three-0.185.0.tgz'),
    // ],
};
