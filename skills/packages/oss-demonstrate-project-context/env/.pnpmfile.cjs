function readPackage(pkg, context) {
    if (pkg.name === 'oss-metahuman-shanxi') {
        pkg.dependencies = {
            ...pkg.dependencies,
            antd: '5.8.4',
            '@babel/plugin-proposal-private-property-in-object': '7.20.5',
            'react-router-dom': '5.2.0',

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
        };

        // Object.keys(pkg.dependencies).forEach((key) => {
        //     if (key.startsWith('@midwayjs')) {
        //         pkg.dependencies[key] = pkg.dependencies[key].replace('^', '');
        //     }
        // });

        pkg.devDependencies = {
            ...pkg.devDependencies,
            '@midwayjs/mock': '3.10.11',
            '@fedx-bff-web/plugin-ssr-midway': '0.5.5',
            '@fedx-bff-web/plugin-ssr-react': '0.5.11',
            '@fedx-bff-web/ssr-types': '0.5.3',
            "fedx-ssr": "0.5.0",
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

    return pkg;
}

module.exports = {
    hooks: {
        readPackage,
    },
};
