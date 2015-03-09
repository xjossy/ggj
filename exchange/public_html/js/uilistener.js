/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

exchange.init.push(
    function() {
        var moveFwd = 0;
        var moveBwd = 0;
        var moveL = 0;
        var moveR = 0;

        var updSpeed = function() {
            if( exchange.userTank===null ) return;

            exchange.userTank.movable.speed = (moveFwd - moveBwd) * exchange.gameParams['tankSpeed'];
            exchange.userTank.movable.dirspeed = (moveR - moveL) * exchange.gameParams['tankDirSpeed'];
        };

        document.body.onkeydown = function(e) {
            if( e.keyCode === 38 ) moveFwd = 1;
            if( e.keyCode === 40 ) moveBwd = 1;
            if( e.keyCode === 37 ) moveL = 1;
            if( e.keyCode === 39 ) moveR = 1;

            updSpeed();
        };

        document.body.onkeyup = function(e) {
            if( e.keyCode === 38 ) moveFwd = 0;
            if( e.keyCode === 40 ) moveBwd = 0;
            if( e.keyCode === 37 ) moveL = 0;
            if( e.keyCode === 39 ) moveR = 0;

            updSpeed();
        };

        document.body.onkeypress = function(e) {
            if( exchange.userTank===null ) return;

            if( e.charCode === 32 ) exchange.userTank.fire();
        };
    }
);