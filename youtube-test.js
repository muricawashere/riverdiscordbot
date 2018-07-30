
var search = require('youtube-search')

var opts = {
    maxResults: 10,
    key: 'AIzaSyAYGlod1nt7f-sfm7AWKqRoKnSwWh8TkaA'
}

search('closer', opts, function(err, results) {
    if(err) return console.log(err)

    console.dir(results)
})