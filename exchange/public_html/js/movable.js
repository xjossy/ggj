/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

exchange.Movable = function(x, y, dir, div) {
    var movable = this;

    this.x = x;
    this.y = y;
    this.dir = dir;

    this.speed = 0;
    this.dirspeed = 0;
    this.prevSpeed = [null,null];

    this.div = div;

    exchange.gameCont.appendChild(this.div);

    this.updateWidget = function() {
        this.div.style.transform = "translate("+
                this.x*exchange.gameParams['cellw']+"px,"+
                this.y*exchange.gameParams['cellh']+"px) rotate(" + this.dir + "deg)";
    };

    this.prevTime = (new Date()).getTime();

    this.onIntersectWall = function(wall) {};

    this.remove = function() {
        if(!(movable in exchange.deletions)) {
            exchange.deletions.push(movable);
        }
        if( div.parentNode===exchange.gameCont )
            exchange.gameCont.removeChild(div);
    };

    this.moveFwd = function(length) {
        var px = this.x;
        var py = this.y;

        this.x += length * Math.cos(this.dir*2*Math.PI / 360);
        this.y += length * Math.sin(this.dir*2*Math.PI / 360);

        var wall = exchange.intersectedWall(this.x, this.y, this.radius);

        if( wall!==undefined ) {
            this.x = px;
            this.y = py;

            this.onIntersectWall(wall);
        }
    };

    this.step = function() {
        if( this.speed!==this.prevSpeed[0] || this.dirspeed!==this.prevSpeed[1] ) {
            if(!(this in exchange.changedMovements)) {
                exchange.changedMovements.push(this);
            }
        }

        this.prevSpeed[0] = this.speed;
        this.prevSpeed[1] = this.dirspeed;

        var ctime = (new Date()).getTime();
        var timeDelta = ctime - this.prevTime;

        this.moveFwd(timeDelta * this.speed);
        this.dir += timeDelta * this.dirspeed;

        this.prevTime = ctime;
    };

    this.updateWidget();
};