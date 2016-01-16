Template.TableFilters.helpers({
    getFilterTemplate() {
        return 'TableFilters' + this.type;
    },
    getData() {
        return {
            Table: Template.parentData(1)['Table'],
            filter: this
        }
    }
});