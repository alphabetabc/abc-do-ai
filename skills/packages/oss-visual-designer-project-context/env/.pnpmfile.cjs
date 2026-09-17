function readPackage(pkg, context) {
    // Override the manifest of foo@1.x after downloading it from the registry
    if (pkg?.name === 'oss-visual-designer') {
        context.log('依赖注入:oss-visual-designer');
        pkg.dependencies = {
            ...pkg.dependencies,
            // '@types/react-router-dom': '5',
            '@formily/react': '2.2.10',
            tslib: '*',
            'language-tags': '1.0.5',
            '@types/lodash': '4.14.201',
            // 'react-error-overlay': '6.0.9',
            'react-router-dom': '5.3.4',
            'react-router': '5.3.4',
            // antd: '*',

            // 测试
            '@fedx-vis/designer-types': 'workspace:*',
            '@fedx-vis/request': 'workspace:*',
            '@fedx-vis/share': 'workspace:*',
            '@fedx-vis/ui': 'workspace:*',
            '@fedx-vis/utils': 'workspace:*',
            '@fedx-vis/hooks': 'workspace:*',

            // "oss-web-common": "^0.2.36",
            'oss-web-common': pkg.dependencies['oss-web-common'] !== '0.3.1' ? '^0.2.36' : '0.3.1',
        };

        pkg.devDependencies = {
            ...pkg.devDependencies,
            // '@fedx-vis/tools': 'workspace:*',
        };
    }

    if (pkg?.name === 'fedx-report') {
        context.log('依赖注入: fedx-report');
        if (!pkg.dependencies['fedx-report']) {
            pkg.dependencies = {
                ...pkg.dependencies,
                'fedx-report': pkg.version,

                // 固定依赖
                '@formily/core': '2.2.10',
                '@formily/grid': '2.2.10',
                '@formily/json-schema': '2.2.10',
                '@formily/path': '2.2.10',
                '@formily/react': '2.2.10',
                '@formily/reactive': '2.2.10',
                '@formily/reactive-react': '2.2.10',
                '@formily/shared': '2.2.10',
            };
        }
        pkg.dependencies = {
            ...pkg.dependencies,
            '@monaco-editor/react': '4.4.6',
        };
    }

    if (pkg?.name === 'oss-web-toolkits') {
        pkg.dependencies = {
            ...pkg.dependencies,
            '@types/lodash': '4.14.201',
        };
    }

    if (pkg.name === 'antd-img-crop') {
        pkg.dependencies = {
            ...pkg.dependencies,
            antd: '4.16.2',
        };
    }

    return pkg;
}

module.exports = {
    hooks: {
        readPackage,
    },
};
