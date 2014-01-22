$(function() {
    var input = $('textarea');
    var form = $('form');
    var output = $('tbody');

    var template = Handlebars.compile($('#template').html());

    $.ajaxQueue = function(params) {
        return $.ajax(params);
    };

    var show = function(row, data, text, score) {
        console.log(data);

        data.text = text;
        data.score = Math.round(score);

        if (score > 6) {
            data.confidence = 'high';
        } else if (score > 3) {
            data.confidence = 'medium';
        } else {
            data.confidence = 'low';
        }

        if (typeof data.author == 'string') {
            data.author = [data.author];
        }

        $.each(data.author, function(index, author) {
            data.author[index].given = author.given.split(/\s+/).map(function(name) {
                return name.substr(0, 1);
            }).join('');
        });

        data.etal = data.author.length > 10;
        data.author = data.author.slice(0, 10);

        data.year = data.issued['date-parts'][0][0];

        row.append(template(data));
        row.prettyTextDiff({ cleanup: true });
    };

    var fetch = function (row, url, text, score) {
        var request = $.ajaxQueue({
            url: url.replace(/dx.doi.org/, 'data.crossref.org'),
            headers: { 'Accept': 'application/citeproc+json' }
        }, { priority: true, tries: 1 });

        request.done(function(data) {
            show(row, data, text, score);
        }).fail(function() {
            show(row, {}, text);
        });
    };

    var search = function(index, text) {
        var row = $('<tr/>').appendTo(output);

        var request = $.ajaxQueue({
            url: 'http://search.crossref.org/dois',
            data: { q: text },
            dataType: 'json'
        });

        request.done(function(data) {
            var result = data[0];

            if (result) {
                fetch(row, result.doi, text, result.score);
            } else {
                show(row, {}, text);
            }
        }).fail(function() {
            show(row, {}, text);
        });
    };

    var update = function(event) {
        event.preventDefault();

        output.empty();

        var items = input.val().split("\n");

        $.each(items, search);
    };

    form.on('submit', update);

    // load the example list
    $.get('example.txt', function(data) {
        input.val(data);
        form.submit();
    }, 'text');
})