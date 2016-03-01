Template.TableFiltersSelect.helpers({
    getFilterSize() {
        return this.size || 4;
    },
    isItemActive() {
        var Table = Template.instance().data.Table;
        var values = Table.filters.get();
        var filterName = Template.instance().data.filter.id ? Template.instance().data.filter.id : (Template.instance().data.filter.name ? Template.instance().data.filter.name : Template.instance().data.filter.type);
        return values[filterName] == this.value;
    }
});

Template.TableFiltersSelect.events({
    'change select'(e) {
        var filterName = this.filter.id ? this.filter.id : (this.filter.name ? this.filter.name : this.filter.type);
        var Table = this.Table;

        var values = Table.filters.get();

        if ( $(e.currentTarget).val()) {
            values[filterName] = $(e.currentTarget).val();
            Table.filters.set(values);
        } else {
            Table.filters.set(_.omit(values,filterName));
        }
    }
});