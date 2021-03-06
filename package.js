Package.describe({
    name: 'jaaaco:inspinia-table',
    version: '0.0.33',
    // Brief, one-line summary of the package.
    summary: 'Reactive Tables with pagination, filters and more for Inspinia Admin Template (Bootstrap3)',
    // URL to the Git repository containing the source code for this package.
    git: 'https://github.com/jaaaco/inspinia-table.git',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.2.1');

    api.addFiles('lib/Table.html', ['client']);
    api.addFiles('lib/Table.js', ['client']);
    api.addFiles('lib/Table.css', ['client']);

    api.addFiles('lib/TableFilters.html', ['client']);
    api.addFiles('lib/TableFilters.js', ['client']);

    api.addFiles('lib/TablePagination.html', ['client']);
    api.addFiles('lib/TablePagination.js', ['client']);

    api.addFiles('lib/filters/predefined.html', ['client']);
    api.addFiles('lib/filters/predefined.js', ['client']);

    api.addFiles('lib/filters/select.html', ['client']);
    api.addFiles('lib/filters/select.js', ['client']);

    api.addFiles('lib/filters/button.html', ['client']);
    api.addFiles('lib/filters/button.js', ['client']);

    api.use('blaze-html-templates','client');
    api.use('ecmascript');
    api.use('ejson');
    api.use('wfirma:dot@0.0.2','client');
    api.use('jaaaco:template-logic@0.0.3','client');
});
