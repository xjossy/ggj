/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

exchange.init.push(function() {
    exchange.overlayInner = $('#overlay .overlayInner')[0];
});

exchange.globalTick = function() {
    
    if( exchange.gameStarted ) {
        if( window.requestAnimationFrame )
            window.requestAnimationFrame(exchange.globalTick);
        else 
            window.setTimeout(exchange.globalTick, 50);
    }
    else return;

    exchange.changedMovements = [];

    for(var unit in exchange.gameUnits) {
        exchange.gameUnits[unit].step();
        if( unit < exchange.gameUnits.length ) 
            exchange.gameUnits[unit].updateWidget();
    }

    if(!exchange.isEditor ) {
        if( exchange.changedMovements.length>0 || exchange.deletions.length>0 || exchange.deletedWalls.length>0 ) {
            var speedarr = [];
            var delarr = [];
            for(var i in exchange.changedMovements) {
                var obj = exchange.changedMovements[i];
                speedarr.push([obj.id, obj.x, obj.y, obj.dir, obj.type,
                    obj.speed,obj.dirspeed]);
            }
            for(var i in exchange.deletions) {
                delarr.push(exchange.deletions[i].id);
            }
            
            exchange.sendJSON([speedarr, delarr, exchange.deletedWalls]);
            
            exchange.deletions = [];
            exchange.deletedWalls = [];
        }

        var x = (exchange.userTank.movable.x - exchange.gameParams['tankRadius']) * exchange.gameParams['cellw'];
        var y = (exchange.userTank.movable.y - exchange.gameParams['tankRadius']) * exchange.gameParams['cellh'];

        exchange.overlayInner.style.left = (x - 750) + "px";
        exchange.overlayInner.style.top  = (y - 750) + "px";
    }
};