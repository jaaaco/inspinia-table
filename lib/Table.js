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

    // obsługa subskrypcji
    this.autorun(() => {
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

    // obsługa filtrów
    this.autorun(() => {
        let selector = {};
        let filters = this.filters.get();

        let systemFilters = false;

        _.each(this.data.filters,(filter) => {
            switch (filters[filter.name ? filter.name : filter.type]) {
                case '_draft':
                    systemFilters = {draft: true};
                    break;
                case '_deleted':
                    systemFilters = {deleted: true};
                    break;
                default:
                    _.extend(selector,filter.selector(filters[filter.name ? filter.name : filter.type]));
            }
        });

        if (!_.isEmpty(systemFilters)) {
            this.filterSelector.set(systemFilters);
        } else {
            _.extend(selector,{draft: null, deleted: null});
            this.filterSelector.set(selector);
        }
    });

    // obsługa wyszukiwarki
    this.autorun(()=>{
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



    // nazwa tabeli na podstawie kolekcji i etykiet kolumn
    let uuid = this.data.collection._name + ':' + _.pluck(this.data.columns,'label').join('|');

    // odtwarzanie ustawien tabeli
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

            if (settings.filters) {
                this.filters.set(settings.filters);
            }
        }
    } catch (e) {}

    this.filterTitle = new ReactiveVar('');

    // zapis ustawień tabeli przy zmianie
    this.autorun(() => {
        var settings = {
            sort: this.sort.get(),
            page: this.page.get(),
            searchQuery: this.searchQuery.get(),
            filters: this.filters.get()
        };
        localStorage.setItem('Table.' + uuid, EJSON.stringify(settings));
    });
});

Template.Table.helpers({
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
    searchQuery() {
        return Template.instance().searchQuery.get();
    },
    sorting() {
        let field = this.sortField ? this.sortField : this.field;
        var sort = Template.instance().sort.get();
        return sort[field];
    }
});


Template.Table.events({
    'click .TableAction' (e,t) {
        e.preventDefault();
        if (_.isFunction(this.onClick)) {
            this.onClick.call();
        }
    },
    'click tbody tr' (e,t) {
        e.preventDefault();
        if (_.isFunction(t.data.onClick)) {
            t.data.onClick.call(this);
        }
    },
    'keyup input.TableSearch' (e,t) {
        t.searchQuery.set($(e.currentTarget).val());
        t.page.set(1);
    },
    'click th.TableSort' (e,t) {
        let field = this.sortField ? this.sortField : this.field;
        if (_.isString(field)) {
            var sort = t.sort.get();
            t.sort.set({[field]: sort[field] == 1 ? -1 : 1});
        }
    }
});

// TODO: konfiguracja kolumn
// TODO: zapisywanie ustawień tabeli w profilu użytkownika (kolumny, filtry)
// TODO: buttony pozostałych akcji z dropdowna
// TODO: wyszukiwanie throttled
