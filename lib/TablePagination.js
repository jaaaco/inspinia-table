Template.TablePagination.events({
    'click .TablePaginationPrev'(e) {
        e.preventDefault();
        let page = this.Table.page.get();

        if (page > 1) {
            this.Table.page.set(--page);
        }
    },
    'click .TablePaginationNext'(e) {
        e.preventDefault();
        let page = this.Table.page.get();

        this.Table.page.set(++page);
    },

    'click .TablePaginationReset'(e) {
        e.preventDefault();
        this.Table.page.set(1);
    }
});

Template.TablePagination.helpers({
    page() {
        return this.Table.page.get();
    }
});