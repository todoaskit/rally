var clientId = '785081542704-6gbo1ku7lhdok50pai52n28adlfgpjva.apps.googleusercontent.com';
var apiKey = 'AIzaSyD9v41gd511lFHseGqCXwNyfpQyArNgZLQ';

function initMap() {
    toggleLoading("#loading");
    createMap();
    initLegend();
    initDB();
    markMap(null);


    map.setCenter(kaist);


    var playersRef = firebase.database().ref("petition/");
    infoWindow = new google.maps.InfoWindow({ map: map });
    infoWindow.close();

    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.on("value", function(snapshot) {
            var users = snapshot.val();
            var datas = {},
                download = [],
                upload = [];

            /* before append, remove previously added rows. */
            $('.table-inbox tbody').empty()

            for (var o in users) {
                if (users[o]["time-line"]["erase"]) continue;
                var submitDate = new Date(users[o]["time-line"]["submit"]);
                var passed = new Date() > submitDate.setDate(submitDate.getDate() + 1);

                var progress = "";

                // Add the circle for the petition to the map.
                var cityCircle = createCircle(o, { lat: users[o].latitude, lng: users[o].longitude }, users[o].title);

                cityCircle.addListener('click', function(e) {
                    infoWindow.open(map);
                    infoWindow.setContent(this.title + " <a class='btn' href='./timeline.html?id=" + this.petitionID + "'>자세히 보기</a>");
                    infoWindow.setPosition(this.getCenter())
                });


            }

            toggleLoading("#loading");
        },
        function(errorObject) {
            alert("The read failed: " + errorObject.code);
        });
}