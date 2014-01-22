$(function() {
    var input = $('textarea');
    var output = $('tbody');
    var template = Handlebars.compile($('#template').html());

    // handle form submissions
    $('form').on('submit', function(event) {
        event.preventDefault();
        output.empty();
        input.val().split("\n").forEach(resolve);
    });

    // load the example list
    $.get('example-small.txt', function(data) {
        input.val(data);
    }, 'text');

    // fill data into the table row
    var show = function(row, data, text, score) {
        //console.log(data);

        $.extend(data, {
            text: text,
            score: Math.round(score),
            confidence: confidence(score),
            year: data.issued['date-parts'][0][0],
        })

        formatAuthors(data);

        row.append(template(data));
        row.prettyTextDiff({ cleanup: true });
    };

    // normalise the author names
    var formatAuthors = function(data) {
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
    };

    // a text value for the confidence score
    var confidence = function(score) {
        if (score > 6) {
            return 'high';
        }

        if (score > 3) {
            return 'medium';
        }

        return 'low';
    };

    // resolve the reference text to structured data
    var resolve = function(text) {
        var row = $('<tr/>').appendTo(output);

        var handleFail = function() {
            show(row, {}, text);
        }

        var request = $.crossref.search(text, { rows: 1 }).fail(handleFail);

        request.done(function(results) {
            if (results && results.length) {
                var data = results[0];
                var score = data.score;

                var request = $.crossref.fetch(data.doi, 'application/citeproc+json').fail(handleFail);

                request.done(function(data) {
                    show(row, data, text, score);
                });
            } else {
                show(row, {}, text, 0);
            }
        });
    };
})