/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


exchange.Tank = function(x, y, dir, type) {
    var tank = this;

    this.type = type;
    this.phase = 0;

    this.lastFireTime = 0;

    this.div = document.createElement('div');
    this.div.className = "tank";

    this.movable = new exchange.Movable(x,y,dir, this.div);

    this.alive = true;

    gameEngine.tanks.push(this);

    this.movable.id = 't'+gameEngine.getId();
    this.movable.radius = gameParams['tankRadius'];
    this.movable.type = type;

    this.updateWidget = function() {
        this.div.style.backgroundPositionX = ((this.phase % 8) * 24) + "px";
        this.div.style.backgroundPositionY = ((this.type  % 8) * 24) + "px";

        this.movable.updateWidget();
    };

    this.damage = function() {
        tank.alive = false;
        tank.remove();
    };

    this.moveTo = function(x,y) {
        this.movable.x = x;
        this.movable.y = y;
        this.movable.updateWidget();
    };

    this.step = function() {
        if( this.movable.speed!==0 ) {
            this.phase = (this.phase + 1) % 8;
        }

        this.movable.step();
    };

    this.getDirTo = function(x,y) {
        return Math.atan2(y - this.movable.y, x - this.movable.x) / Math.PI / 2 * 360;
    };

    this.fire = function() {
        var ctime = (new Date()).getTime();

        if( ctime-this.lastFireTime < 1000 / gameParams['fireFreq'] ) return;

        var bullet = new Bullet(this.movable.x, this.movable.y, this.movable.dir);
        bullet.firedBy = tank;

        this.lastFireTime = ctime;
    };

    this.remove = function() {
        this.movable.remove();
        var idx = gameUnits.indexOf(this);
        if( idx>=0 ) gameUnits.splice(idx,1);
    };
};