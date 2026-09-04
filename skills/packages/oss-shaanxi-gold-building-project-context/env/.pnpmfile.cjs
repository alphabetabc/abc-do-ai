function readPackage(pkg, context) {
    if (pkg.dependencies['whatwg-url']) {
        pkg.dependencies = {
            ...pkg.dependencies,
            'whatwg-url': '13.0.0',
        };
        context.log(`[更新 whatwg-url]：${pkg.name}`);
    }

    if (pkg.name === 'http-proxy-middleware') {
        pkg.dependencies = {
            ...pkg.dependencies,
            'http-proxy': 'file:.local-deps/http-proxy',
        };
        context.log(`[更新 http-proxy]：${pkg.name}`);
    }

    return pkg;
}

module.exports = {
    hooks: {
        readPackage,
    },
};
