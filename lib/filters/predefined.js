Template.TableFiltersPredefined.events({
    'click a'(e,t) {
        e.preventDefault();
        var filterName = t.data.filter.name ? t.data.filter.name : t.data.filter.type;

        var Table = t.data.Table;

        var values = Table.filters.get();

        if (values[filterName] == this.value) {
            Table.filters.set(_.omit(values,filterName));
            Table.filterTitle.set('');
        } else {
            values[filterName] = this.value;
            Table.filters.set(values);
            Table.filterTitle.set(this.label);
        }
    }
});

Template.TableFiltersPredefined.helpers({
    draftFilter() {
        return {
            value: '_draft',
            label: 'wpisy robocze'
        };
    },
    deletedFilter() {
        return {
            value: '_deleted',
            label: 'wpisy usunięte'
        };
    },
    isActive() {
        var Table = Template.instance().data.Table;
        var values = Table.filters.get();
        var filterName = Template.instance().data.filter.name ? Template.instance().data.filter.name : Template.instance().data.filter.type;

        return values[filterName];
    },
    isItemActive() {
        var Table = Template.instance().data.Table;
        var values = Table.filters.get();
        var filterName = Template.instance().data.filter.name ? Template.instance().data.filter.name : Template.instance().data.filter.type;

        if (values[filterName] == this.value) {
            Table.filterTitle.set(this.label);
        }

        return values[filterName] == this.value;
    }
});