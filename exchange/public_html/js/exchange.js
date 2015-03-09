var exchange = new function() {
    this.gameParams =  {
        'bulletRadius': 1,
        'fireFreq': 2.5,
        'tankRadius' : 1.8,
        'tankDirSpeed' : .2,
        'tankSpeed' : 1/150,
        'cellw' : 8,
        'cellh' : 8,
        'size': 50,
        'ping-interval': 10000,
        'server' :"ws://192.168.1.54:9076/",
        'build-distance-wall' : 5,
        'build-distance-tank' : 10
    };
    
    this.gameCont = document.getElementById('gameCont');
    
    this.userTank = null;
    
    this.init = [];
    
    this.init.push(function(){
        exchange.tanks = [];
        exchange.units = [];
    });
}();