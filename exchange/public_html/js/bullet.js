/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

exchange.Bullet = function(x,y,dir) {
    var bullet = this;

    this.div = document.createElement('div');
    this.div.className = "bullet";

    this.movable = new exchange.Movable(x,y,dir, this.div);
    this.movable.speed = .03;
    this.movable.id = 'b'+gameEngine.getId();

    this.movable.radius = exchange.gameParams['bulletRadius'];

    this.updateWidget = function() {
        this.movable.updateWidget();
    };

    this.step = function() {
        this.movable.step();
        if( exchange.isEditor ) return;
        for(var i in exchange.tanks) {
            var tank = exchange.tanks[i];

            if(!tank.alive || tank===bullet.firedBy) continue;

            var dx = tank.movable.x - this.movable.x;
            var dy = tank.movable.y - this.movable.y;

            if( dx*dx+dy*dy<gameParams['tankRadius']*gameParams['tankRadius'] ) {
                bullet.remove();
                tank.damage();
            }
        }
    };

    this.movable.onIntersectWall = function(wall) {
        bullet.remove();
        if( exchange.isEditor ) return;
        if( wall[1]<0 || wall[0]<0 || wall[0]>=size || wall[1] >=size ) return;

        var cell = exchange.rows[Math.floor(wall[1])][Math.floor(wall[0])];
        if( cell.deletableWall && cell.isWall ) {
            cell.isWall = false;
            cell.synhCell();

            exchange.deletedWalls.push([cell.x, cell.y]);
        }
    };

    exchange.gameUnits.push(this);

    this.remove = function() {
        this.movable.remove();
        var idx = exchange.gameUnits.indexOf(this);
        if( idx>=0 ) exchange.gameUnits.splice(idx,1);
    };
};