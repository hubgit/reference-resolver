$(function() {
    var input = $('textarea');
    var form = $('form');
    var output = $('ol');

    var template = Handlebars.compile($('#template').html());

    var update = function(event) {
        event.preventDefault();

        output.empty();

        var items = input.val().split("\n");

        var show = function(index, result) {
            console.log(result);

            var text = items[index];

            if (!result.doi || !result.coins) {
            //if (!result.match || !result.coins) {
                $('<li/>', { text: text }).addClass('error').appendTo(output);
                return;
            }

            var coins = $.deparam(result.coins.replace(/&amp;/g, '&'));

            if (!coins.rft_id) {
                $('<li/>', { text: text }).addClass('error').appendTo(output);
                return;
            }

            var item = {
                text: text,
                score: result.score
            };

            $.each(coins, function(key, value) {
                key = key.replace(/^rft\./, '');
                item[key] = value;
            });

            if (typeof item.au == 'string') {
                item.au = [item.au];
            }

            //item.url = item.rft_id.replace(/^info:doi\//, '');
            item.url = result.doi;

            output.append(template(item));
        };

        /*
        var request = $.ajax({
            type: 'POST',
            url: 'http://search.crossref.org/links',
            data: JSON.stringify(items),
            contentType : 'application/json',
            dataType: 'json'
        });
        */

        $.each(items, function(index, item) {
            var request = $.ajaxQueue({
                url: 'http://search.crossref.org/dois',
                data: { q: item },
                dataType: 'json'
            });

            request.done(function(data) {
                show(index, data[0]);
            });
        });

        /*
        var request = $.ajax({
            url: 'result.json',
            dataType: 'json'
        });

        request.done(function(data) {
            $.each(data.results, fshow);
        });
        */
    };

    form.on('submit', update);

    // load the example list
    $.get('example.txt', function(data) {
        input.val(data);
        form.submit();
    }, 'text');
})