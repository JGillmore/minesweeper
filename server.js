var express = require('express');
var app = express();

app.use(express.static(__dirname+"/static"));
app.set('views', __dirname+'/views');
app.set('view engine', 'ejs');

var player_num = 0;
var mapHeight = 20;
var mapWidth = 40;
var game_num = 0;
var mapstr = [];

function initializeMap(){
  var map = [];
  for (var i = 0; i < mapHeight; i++){
    map[i]=[];
    for (var j = 0; j < mapWidth; j++){
      map[i][j] = 0;
    }
  }
  return map;
}
function incrementBlock(x,y, map){
  //if checks to make sure the block is part of the map
  if (x < mapHeight && y < mapWidth && x >= 0 && y >= 0){
    if (map[x][y] != 10){
      //if the block is not a bomb the number in the block is incremented by one
      map[x][y]++;
    }
  }
  return map;
}
function generateMap(bombs){
  var map = initializeMap();
  //random generation of bomb placements
  while (bombs > 0){
    var x = Math.trunc(Math.random()*mapHeight);
    var y = Math.trunc(Math.random()*mapWidth);
    if (map[x][y] != 10){
      map[x][y] = 10; //if the block chosen isnt already a bomb set it to a bomb
      //checks all boxes around the bomb to increment the number by one (if the adjacent block isnt a bomb itself)
      map = incrementBlock(x+1,y+1, map);
      map = incrementBlock(x,y+1, map);
      map = incrementBlock(x-1,y+1, map);
      map = incrementBlock(x+1,y, map);
      map = incrementBlock(x-1,y, map);
      map = incrementBlock(x+1,y-1, map);
      map = incrementBlock(x,y-1, map);
      map = incrementBlock(x-1,y-1, map);
    }
    else{
      continue;//if the block is already a bomb start the loop over without subtracting a bomb
    }
    bombs--;
  }
  return map;
}//end function generateMap
function stringifyMap(game_num){
  var map = generateMap(100);
  mapstr[game_num] = '';
  for(var x = 0; x < mapHeight; x++){
    for(var y = 0; y < mapWidth; y++){
      //adds the html for each row to the string
      mapstr[game_num] += "<div id = '"+x+"-"+y+"'class = '"+map[x][y]+"' idx = '"+x+"' idy = '"+y+"'><h3></h3></div>\n";
    }
    //adds html to start the new collumn to the string, the "\n" puts a new line character into the string so the page is easier to read when you use inspect element
    mapstr[game_num] += "<br>\n"
  }
  return mapstr[game_num];
}

app.get('/', function(request,response){
  response.render('index');
})

var server = app.listen(4000,function(){
  console.log("listening on 4000");
})

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket){
  if (player_num == 0){
    player_num = 1;
    mapstr[game_num] = stringifyMap(game_num);
    socket.emit('create_map', {map:mapstr[game_num], mapWidth:mapWidth, mapHeight:mapHeight, game_num:game_num})
  }else{
    player_num = 0;
    socket.emit('create_map', {map:mapstr[game_num], mapWidth:mapWidth, mapHeight:mapHeight, game_num:game_num})
    game_num++;
  }
  socket.on("update_map", function (data){
    mapstr[data.game_num]=data.map;
    socket.broadcast.emit('render_map', {map: mapstr[data.game_num], game_num:data.game_num})
  })
  socket.on('reset_map', function(data){
    mapstr[data.game_num] = stringifyMap();
    io.emit('render_map', {map:mapstr[data.game_num], game_num:data.game_num})
  })
})
