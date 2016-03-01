/* global ReactiveVar */
"use strict";

Template.Table.onCreated(function(){

    this.page = new ReactiveVar(1);

    let sort = this.data.sort ? this.data.sort : (this.data.sorting ? this.data.sorting : {name: 1});

    this.sort = new ReactiveVar(sort);
    this.filterSelector = new ReactiveVar({});
    this.searchSelector = new ReactiveVar({});
    this.limit = new ReactiveVar(10);
    this.searchQuery = new ReactiveVar('');

    this.filters = new ReactiveVar({});

    // nazwa tabeli na podstawie kolekcji i etykiet kolumn
    this.uuid =  this.data.uuid || new ReactiveVar((this.data.collection._name + ':' + _.pluck(this.data.columns,'label').join('|')));

    // obsługa filtrów
    this.autorun(() => {
        let uuid = this.uuid.get();

        let selector = {};
        let filters = this.filters.get();

        let systemFilters = false;

        _.each(this.data.filters,(filter) => {
            switch (filters[filter.id ? filter.id : (filter.name ? filter.name : filter.type)]) {
                case '_draft':
                    systemFilters = {draft: true};
                    break;
                case '_deleted':
                    systemFilters = {deleted: true};
                    break;
                default:
                    _.extend(selector,filter.selector(filters[filter.id ? filter.id : (filter.name ? filter.name : filter.type)], this));
            }
        });

        if (!_.isEmpty(systemFilters)) {
            this.filterSelector.set(systemFilters);
        } else {
            if (!this.data.showDraft) {
                _.extend(selector,{draft: null, deleted: null});
                this.filterSelector.set(selector);
            }
        }
    });

    // obsługa wyszukiwarki
    this.autorun(()=>{
        let uuid = this.uuid.get();

        var searchQuery = this.searchQuery.get();

        var queries = searchQuery.split(' ');
        var selector = {};

        var ands = [];

        for (var i=0; i<queries.length; i++) {

            if (queries[i]) {

                // przeszukiwanie kolumn
                var columnConditions = [];
                _.forEach(this.data.columns, function (column) {
                    if (typeof column.field == 'string') {
                        var columnCondition = {};
                        columnCondition[column.field] = {
                            $regex: (+queries[i] == queries[i] ? +queries[i] : queries[i]) + '',
                            $options: 'i'
                        };
                        columnConditions.push(columnCondition);
                    }

                    if (typeof column.sortField == 'string') {
                        var columnCondition = {};
                        columnCondition[column.sortField] = {
                            $regex: (+queries[i] == queries[i] ? +queries[i] : queries[i]) + '',
                            $options: 'i'
                        };
                        columnConditions.push(columnCondition);
                    }
                });

                _.forEach(this.data.searchColumns, function (column) {
                    var columnCondition = {};
                    columnCondition[column] = {
                        $regex: (+queries[i] == queries[i] ? +queries[i] : queries[i]) + '',
                        $options: 'i'
                    };
                    columnConditions.push(columnCondition);
                });

                ands.push({$or: columnConditions});
            }
        }

        if (!_.isEmpty(ands)) {
            selector = {$and: ands};
        }
        this.searchSelector.set(selector);
    });

    this.restoring = false;

    // odtwarzanie ustawien tabeli
    this.autorun(() => {
        this.restoring = true;
        let uuid = this.uuid.get();
        try {
            if (EJSON.parse(localStorage.getItem('Table.' + uuid))) {

                var settings = EJSON.parse(localStorage.getItem('Table.' + uuid));

                if (settings.sort) {
                    this.sort.set(settings.sort);
                }

                if (settings.page) {
                    this.page.set(settings.page);
                }

                if (settings.searchQuery) {
                    this.searchQuery.set(settings.searchQuery);
                }

                if (0 && settings.filters) {
                    this.filters.set(settings.filters);
                } else {
                    let filters = {};
                    // domyslne wartości ustawienia filtrów
                    _.each(this.data.filters,(filter) => {
                        if (filter.default) {
                            let filterName = filter.id ? filter.id : (filter.name ? filter.name : filter.type);
                            filters[filterName] = filter.default;
                        }
                    });
                    this.filters.set(filters);
                }
            }
        } catch (e) {}
        this.restoring = false;
    });

    this.filterTitle = new ReactiveVar('');

    // zapis ustawień tabeli przy zmianie
    this.autorun((computation) => {
        if (this.restoring) {
            computation.stop();
        }

        let uuid = this.uuid.get();
        var settings = {
            sort: this.sort.get(),
            page: this.page.get(),
            searchQuery: this.searchQuery.get(),
            filters: this.filters.get()
        };
        localStorage.setItem('Table.' + uuid, EJSON.stringify(settings));
    });

    // obsługa subskrypcji
    this.autorun(() => {
        let uuid = this.uuid.get();
        var selector = this.data.selector ? this.data.selector : {};
        var fields = this.data.fields ? this.data.fields : {};

        _.extend(selector,this.filterSelector.get());
        _.extend(selector,this.searchSelector.get());

        this.subscribe(this.data.collection._name,
            selector,
            {
                sort: this.sort.get(),
                limit:  this.limit.get() * 2, // read ahead
                skip: (this.page.get() - 1)* this.limit.get(),
                fields: fields
            }
        );
    });
});

Template.Table.helpers({
    getHeaderAttributes() {
        let attrs = {};

        if (this.headerClass) {
            _.extend(attrs, {class: this.headerClass})
        } else {
            if (this.class) {
                _.extend(attrs, {class: this.class});
            }
        }

        if (attrs.class) {
            attrs.class += ' TableSort';
        } else {
            _.extend(attrs, {class: 'TableSort'});
        }

        return attrs;
    },
    getRowAttributes() {
        let attrs = {};

        if (this.rowClass) {
            _.extend(attrs, {class: this.rowClass})
        } else {
            if (this.class) {
                _.extend(attrs, {class: this.class});
            }
        }

        return attrs;
    },
    filterTitle(){
        return Template.instance().filterTitle.get();
    },
    getInstance() {
        return Template.instance();
    },
    rows() {
        let t = Template.instance();

        let selector = Template.instance().data.selector ? Template.instance().data.selector : {};

        if (t.filterSelector.get()) {
            _.extend(selector, t.filterSelector.get());
        }

        if (t.searchSelector.get()) {
            _.extend(selector, t.searchSelector.get());
        }

        return t.data.collection.find(selector,{
            sort: t.sort.get(),
            limit: t.limit.get()
        });
    },
    getColumnValue() {
        let data = Template.parentData(1);
        let column = this;

        if (_.isFunction(column.field)) {
            return column.field.call(data);
        }

        return dot(data,column.field);
    },
    getColumnData() {
        let data = Template.parentData(1);
        return this.data.call(data);
    },
    searchQuery() {
        return Template.instance().searchQuery.get();
    },
    sorting() {
        let field = this.sortField ? this.sortField : this.field;
        var sort = Template.instance().sort.get();

        if (_.isArray(field)) {
            return sort[field[0]];
        } else {
            return sort[field];
        }
    }
});


Template.Table.events({
    'click a.TableColumnLink' (e,t) {
        e.preventDefault();
        if (_.isFunction(this.onClick)) {
            this.onClick.call(dot(e,'currentTarget.parentElement.parentElement.$blaze_range.view.dataVar.curValue'),Template.currentData());
        }
    },
    'click .TableAction' (e,t) {
        e.preventDefault();
        if (_.isFunction(this.onClick)) {
            this.onClick.call(this,Template.currentData());
        }
    },
    'click tbody tr' (e,t) {
        e.preventDefault();
        if (_.isFunction(t.data.onClick)) {
            t.data.onClick.call(this,e,t.data);
        }
    },
    'keyup input.TableSearch' (e,t) {
        t.searchQuery.set($(e.currentTarget).val());
        t.page.set(1);
    },
    'change input.TableSearch' (e,t) {
        t.searchQuery.set($(e.currentTarget).val());
        t.page.set(1);
    },
    'click th.TableSort' (e,t) {
        let field = this.sortField ? this.sortField : this.field;
        let sort = t.sort.get();

        if (_.isString(field)) {
            t.sort.set({[field]: sort[field] == 1 ? -1 : 1});
        }

        if (_.isArray(field)) {

            let newSort = {};
            _.each(field, function(fieldName){
                newSort[fieldName] = sort[fieldName] == 1 ? -1 : 1;
            });
            t.sort.set(newSort);
        }
    }
});

// TODO: konfiguracja kolumn
// TODO: zapisywanie ustawień tabeli w profilu użytkownika (kolumny, filtry)
// TODO: buttony pozostałych akcji z dropdowna
// TODO: wyszukiwanie throttled
// TODO: poprawka wyszukiwania przy usuwaniu search query
