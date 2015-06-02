var controller = (function () {

  var N_BATCH = 5;
  var folderPath = "images/full/";
  var listPath = "images/list.txt";
  var distPath = "images/STSIM.csv";
  
  var listimage;
  var label = [];

  var pool;
  var pressAllowed = true;
  var N_TOTAL;

  var Pool = function(N) {
    // a class to store accessed image, 
    // and efficiently get random index and delete
    this.N = 0;  // length of array
    this.a = []; // array store value
    this.H = {}; // store mapping from value -> index

    for (var i = 0; i < N; i++) {
      this.insert(i);
    }
  }

  Pool.prototype.insert = function(value) {
    this.a.push(value);
    this.H[value] = this.N;
    this.N = this.N + 1;
  }

  Pool.prototype.getRandom = function() {
    // get a random element from the Pool
    if (this.N == 0)
      return -1;

    var random = getRandomfromRange(0, this.N -1);
    console.log("index:" + random)
    return this.a[random];
  }

  Pool.prototype.getRandomAndRemove = function() {
    var value = this.getRandom();
    if (value < 0)
      return;
    this.remove(value);
    return value;
  }

  Pool.prototype.contains = function(value){
    return (value in this.H)
  }

  Pool.prototype.remove = function(value){
    // move last element to replace current element
    if (!this.contains(value)) {
      console.log(value);
      throw new Error("Value doesn't exist in the database");
      return;
    }

    var index = this.H[value]
    this.H[this.a[this.N - 1]] = index
    delete this.H[value]

    //swap
    var tmp = this.a[index]
    this.a[index] = this.a[this.N - 1]
    this.N = this.N - 1
  }

  Pool.prototype.getNremain = function(){
    return this.N;
  }
  

  function initializeArray(value, len) {
    // initialize an array of len with value
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(value);
    }
    return arr;  
  }

  function getRandomfromRange(min, max) {
    return Math.round(Math.random() * (max - min) + min);
  }

  function submit() {
    var name = prompt("Please enter your name");

    var Label = Parse.Object.extend("Label");
    var result = new Label();
    result.set("labels", localStorage.getItem("labels"));
    result.set("name", name);

    result.save(null, {
      success : function(result) {
        console.log("Success");
        alert("Stored data sucessfully! Thank you for your participation!");
        location.reload();
      },
      error: function(result, error) {
        console.log("Failure");
        alert("Error submitting data, error code:" + error.message);
      }
    });
  }

  function Next() {
    if ($('#main div:not(:has(:radio:checked))').length > 0) {
      $("<div> You must select all labels before going next </div>").dialog();
      return;
    }
    var divBatch = $("#main div");

    // Record labels
    divBatch.map(function() {
      var id = $(this).find("img").attr("id");
      var label = $(this).find("input:radio:checked").val();
      console.log(id + ":" + label);
      label[id] = label;

      var tmp = localStorage.getItem("labels");
      localStorage.setItem("labels", tmp.concat(id + "," + label + "\n"));
    })

    var Nseen = N_TOTAL - pool.getNremain();
    console.log("You have seen: " + NSeen);
    $("#labelTrue").text("You have labeled: " + NSeen + "/" + N_TOTAL);

    // Shuffle
    $.each(divBatch, function() {
      var tmp = pool.getRandomAndRemove();
      console.log(tmp);
      if (tmp < 0) {
        $("#buttonNext").prop("disabled", true);
        $("#buttonSubmit").css('display', 'inline');
        return;
      }
      $(this).find("img").attr({"src": folderPath.concat(listimage[tmp]),
                      "id": tmp})
    })

    $('#main input[type=radio]').attr('checked', false);
    
  }

  return {
    init: function() {

      localStorage.clear();
      localStorage.setItem("labels","");

      // Ajax request to read textfile
      $.get(listPath, function(data){
        listimage = data.split("\n");
        
        //var N_TOTAL = listimage.length;
        N_TOTAL = 15;

        pool = new Pool(N_TOTAL);
        label = initializeArray(0, N_TOTAL);

        while (pool.getNremain() > 0) {
          console.log("hello world!");
          console.log(pool.getRandomAndRemove());
          console.log("N: " + pool.getNremain());
        }

        // Setup UI
        for (i = 0; i < N_BATCH; i++) {
          var tmp = pool.getRandomAndRemove();
          if (tmp < 0)
            return;

          $("#main").append(
            $("<div>").attr({'id': i, 'class':"image"}).append(
              $("<img />", {
                src: folderPath.concat(listimage[tmp]),
                id:  tmp
              }),

              '<br>',

              $("<label>").attr({
                class: "radio",
              }).text("Natural").append(     
                $("<input />", {
                  type:   "radio",
                  name:   "label" + tmp,
                  value:  "1",
                })),

              '<br>',

              $("<label>").attr({
                class: "radio",
              }).text("Manmade").append(
                $("<input />", {
                  type:   "radio",
                  name:   "label" + tmp,
                  value:  "2",
                })
              ),

              '<br>',

              $("<label>").attr({
                class: "radio",
              }).text("Mixed").append(
                $("<input />", {
                  type:   "radio",
                  name:   "label" + tmp,
                  value:  "3"
                })
              )
            )
          )
        };
      })
      
      $("#buttonNext").on("click", Next);
      $("#buttonSubmit").on("click", submit);

      $(window).keypress(function(e) {
        e.preventDefault();
        if (pressAllowed) {
          pressAllowed = false;
          if (e.keyCode == 0 || e.keyCode == 32) {
            Next();  
          }          
        }
      });

      $(window).keyup(function(e) {
        e.preventDefault();
        pressAllowed = true;
      }); 

      Parse.initialize("q11aUUt7JFAjjr3vSHnCDUVi7xFDx0vYWTkGR4gA", "fR1i3W3vDMLkFCFqC57IFb0lP3Uc73whNPJhKz1w");
    
      // var TestObject = Parse.Object.extend("TestObject");
      // var testObject = new TestObject();
      // testObject.save({asdfasdf: "storing data file"}, {
      //   success: function(object) {
      //     alert("yay! it worked");
      //   }
      // });

    }
  }
}) ();