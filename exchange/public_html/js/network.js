/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

exchange.init.push(function(){
    
});

exchange.sendJSON = function(arg) {
    exchange.sendMessage(JSON.stringify(arg));
}

exchange.sendMessage = function(msg) {
    exchange.socket.send('\0' + msg + '\ff');
}

exchange.sendPing = function() {
    if(!exchange.avaitingGame ) return;

    exchange.sendMessage('PING');
    window.setTimeout(exchange.sendPing, exchange.gameParams['ping-interval']);
};

exchange.startServerDialog = function() {
    if(!exchange.avaitingConnection ) return;

    try {
        exchange.socket = new WebSocket(exchange.gameParams['server']);
    } catch(e) {
        setTimeout(exchange.startServerDialog, 1000);
        return;
    }
    exchange.socket.onmessage = function(event) {
        if( exchange.avaitingGame ) {
            if( event.data==='PLAY' )
                exchange.startPlayer();
            if( event.data==='EDIT' )
                exchange.startEditor();
        } else if(event.data==='CLOSE') {
        } else if( exchange.isEditor ) {
            var data = JSON.parse(event.data);
            for(i in data[0]) {
                //speed and coorrds in data[0]
                var speeds = data[0][i];

                //create object if not exists
                if(!(speeds[0] in exchange.movementById)) {
                    var movable;
                    if( speeds[0][0]==='t' ) {
                        var tank = new Tank(speeds[1], speeds[2], speeds[3], speeds[4]);
                        movable = tank.movable;
                    } else if( speeds[0][0]==='b' ) {
                        var bullet = new Bullet(speeds[1], speeds[2], speeds[3]);
                        movable = bullet.movable;
                    }
                    movable.id = speeds[0];
                    exchange.movementById[movable.id] = movable;

                    exchange.gameUnits.push(movable);
                }
                
                //set object speed and coords
                var movable = exchange.movementById[speeds[0]];
                movable.x = speeds[1];
                movable.y = speeds[2];
                movable.dir = speeds[3];
                movable.speed = speeds[5];
                movable.dirspeed = speeds[6];
            }
            for(i in data[1]) {
                //objects for remove in data[1]
                var id = data[1][i];

                if( id in exchange.movementById ) {
                    exchange.movementById[id].remove();
                }
            }
            for(i in data[2]) {
                //walls for remove in data[1]
                
                var xy = data[2][i];
                var cell = exchange.rows[xy[1]][xy[0]];

                cell.isWall = false;
                cell.synhCell();
            }
        } else {
            //editor sends a message about new created walls and tanks
            var data = JSON.parse(event.data);
            for(i in data) {
                var spec = data[i];
                if(spec[0]==='w') {
                    //if wall created
                    var cell = exchange.rows[spec[2]][spec[1]];
                    cell.isWall=true;
                    cell.deletableWall = true;
                    cell.synhCell();
                } else if(spec[0]==='t') {
                    //if tank created
                    var path = spec[1];

                    var t = new UITank(4, path);
                    exchange.gameUnits.push(t);
                }
            }
        }
    };

    exchange.socket.onopen = function() {
        exchange.avaitingGame = true;
        exchange.avaitingConnection = false;
        window.setTimeout(exchange.sendPing, exchange.gameParams['ping-interval']);
    };
    exchange.socket.onerror = function() {
        setTimeout(exchange.startServerDialog, 1000);
        return;
    };
};