var centertile = {x:0,y:0};
var userid = $('canvas').data('userid');
var userposition ={};
var allPlayersPositions = [];
var firstDraw = true;


// define some basesheets
var map = [];
for (var x=-2; x<=2; x++) {
    for (var y=-2; y<=2; y++)  {
        map.push({
            centerp: { x: x * 200, y: y * 200, z: 0 },
            orientation: {alphaD: 90, betaD: 0, gammaD: 0},
            size: {w:200,h:200},
            init: function() {
                var basesheet = new sheetengine.BaseSheet(this.centerp, this.orientation, this.size);
                basesheet.color = '#5D7E36';
                return basesheet;
            }
        });
    }
}

function loadAndRemoveSheets(oldcentertile, centertile) {
    var boundary = { xmin: centertile.x * 200 - 900, xmax: centertile.x * 200 + 900, ymin: centertile.y * 200 - 900, ymax: centertile.y * 200 + 900 };

    // remove sheets that are far
    for (var i=0;i<map.length;i++) {
        var sheetinfo = map[i];
        if (sheetinfo.centerp.x < boundary.xmin || sheetinfo.centerp.x > boundary.xmax || sheetinfo.centerp.y < boundary.ymin || sheetinfo.centerp.y > boundary.ymax) {
            if (sheetinfo.added) {
                sheetinfo.sheet.destroy();
                sheetinfo.added = false;
            }
        }
    }

    // add new sheets
    for (var i=0;i<map.length;i++) {
        var sheetinfo = map[i];
        if (sheetinfo.centerp.x < boundary.xmin || sheetinfo.centerp.x > boundary.xmax || sheetinfo.centerp.y < boundary.ymin || sheetinfo.centerp.y > boundary.ymax)
            continue;

        if (!sheetinfo.added) {
            sheetinfo.sheet = sheetinfo.init();
            sheetinfo.added = true;
        }
    }

    // translate background
    sheetengine.scene.translateBackground(
        {x:oldcentertile.x*200,y:oldcentertile.y*200},
        {x:centertile.x*200,y:centertile.y*200}
    );
}


bomberman = {
    appid: '4f244f4db41abbfd2c00018c',
    timerInterval: 40,
    sceneIsReady: 0,
    levelsize: 1,
    //levelsize: 4,
    boundarySize: 0.6,
    zoom: 1.4,
    linewidth: 0,
    densityMap: null,

    // moves
    gravity: -2,
    maxmove: 5,
    bypassAngleLeft: -Math.PI/3,
    bypassAngleRight: Math.PI/3,
    bypassDistLeft: 40,
    bypassDistRight: 20,
    maxbypass: 80,
    hoveredObj: null,
    userDamage: 20,
    enemyDamage: 5,
    characterArmPos: {x:-3,y:2,z:13},
    cameraMaxDistance: 30,
    bubbleMessages: [''],
    bubbleLast: -1,
    bubbleCounter: 0,
    bubbleDim: 0,
    bubbleMessageLines: [],
    bubbleCenter: null,
    deletedObjects: {},
    roads: [],

    // init
    init: function() {
        bomberman.linewidth = 1/bomberman.zoom/2;

        //sheetengine.drawObjectContour = true;
        var canvasElement = document.getElementById('mainCanvas');
        sheetengine.scene.init(canvasElement, {w:2000,h:1000});

        // set zoom
        var zoom = bomberman.zoom;
        sheetengine.context.scale(zoom,zoom);
        sheetengine.context.translate(-sheetengine.canvas.width/(2*zoom)*(zoom-1),-sheetengine.canvas.height/(2*zoom)*(zoom-1));

        loadAndRemoveSheets({x:0,y:0}, centertile);

        // draw initial scene
        sheetengine.calc.calculateAllSheets();
        sheetengine.drawing.drawScene(true);

        // multiplayer : init socket
        bomberman.setRecvs();


    },
    sceneReady: function() {

        // init density map
        bomberman.densityMap = new sheetengine.DensityMap(5);
        bomberman.densityMap.addSheets(sheetengine.sheets);
        bomberman.defineUserObj(allPlayersPositions);
        var startp = userposition;
        sheetengine.scene.setCenter(startp);

        // get relative yard coordinates and set initial boundary for visible yards
        var yardpos = sheetengine.scene.getYardFromPos(startp);
        bomberman.setBoundary(yardpos);

        // set object dimming for user: character will dim other sheets, and other objects will not dim the character
        bomberman.user.setDimming(true, true);
        for (var index in bomberman.enemy){
            bomberman.enemy[index].setDimming(true, true);
        }
        sheetengine.calc.calculateAllSheets();
        bomberman.redraw(true);

        $('#mainCanvas').bind('click', bomberman.click);
        bomberman.timer();
        bomberman.sceneIsReady = 1;
    },
    defineUserObj: function(playersPositions) {
        bomberman.enemy = {};
        for (index in playersPositions) {
            // user definition for animation with sheet motion
            var body = new sheetengine.Sheet({x:1,y:0,z:13}, {alphaD:0,betaD:0,gammaD:0}, {w:8,h:14});
            var ctx = body.context;
            // head
            ctx.fillStyle = '#3d1e14';
            ctx.fillRect(1,0,5,5);
            ctx.fillStyle = '#bfbf00';
            ctx.fillRect(2,1,3,3);
            // body
            ctx.fillStyle = '#459';
            ctx.fillRect(1,5,6,1);
            ctx.fillRect(0,6,8,6);
            // left hand
            ctx.fillStyle = '#bfbf00';
            ctx.fillRect(6,12,2,2);
            // belt
            ctx.fillStyle = '#000';
            ctx.fillRect(0,12,6,2);
            var backhead = new sheetengine.Sheet({x:1,y:-0.5,z:17}, {alphaD:0,betaD:0,gammaD:0}, {w:5,h:5});
            backhead.context.fillStyle = '#3d1e14';
            backhead.context.fillRect(0,0,5,5);
            var arm = new sheetengine.Sheet(bomberman.characterArmPos, {alphaD:0,betaD:0,gammaD:-90}, {w:5,h:14});
            arm.context.fillStyle = '#444';
            arm.context.fillRect(0,8,1,5);
            arm.context.fillStyle = '#bfbf00';
            arm.context.fillRect(1,11,1,2);
            arm.context.fillStyle = '#777';
            arm.context.fillRect(2,11,3,2);
            arm.context.fillStyle = '#FFF';
            arm.context.fillRect(3,1,3,10);

            // legs
            var leg1 = new sheetengine.Sheet({x:-1.5,y:0,z:4}, {alphaD:0,betaD:0,gammaD:0}, {w:3,h:8});
            leg1.context.fillStyle = '#3d1e14';
            leg1.context.fillRect(0,0,4,10);
            var leg2 = new sheetengine.Sheet({x:1.5,y:0,z:4}, {alphaD:0,betaD:0,gammaD:0}, {w:3,h:8});
            leg2.context.fillStyle = '#3d1e14';
            leg2.context.fillRect(0,0,4,10);
            leg1.angle = 0;
            leg2.angle = 0;

            console.log(userid)

            if(playersPositions[index].userid == userid){
                userposition = playersPositions[index].position;

                console.log(userposition)
                // define user object
                bomberman.user = new sheetengine.SheetObject({x:userposition.x,y:userposition.y,z:userposition.z}, {alphaD:0,betaD:0,gammaD:0}, [arm,body,backhead,leg1,leg2], {w:40,h:40,relu:20,relv:30});
                bomberman.user.arm = arm;
                bomberman.user.leg1 = leg1;
                bomberman.user.leg2 = leg2;

                bomberman.user.animationState = 0;
                bomberman.user.speed = {x:0,y:0,z:0};
                bomberman.user.health = 100;
                bomberman.user.name = 'User';
            } else {
                var enemyId = playersPositions[index].userid;
                bomberman.enemy[enemyId] = new sheetengine.SheetObject({x:playersPositions[index].position.x,y:playersPositions[index].position.y,z:playersPositions[index].position.z}, {alphaD:0,betaD:0,gammaD:0}, [arm,body,backhead,leg1,leg2], {w:40,h:40,relu:20,relv:30});
                bomberman.enemy[enemyId].arm = arm;
                bomberman.enemy[enemyId].leg1 = leg1;
                bomberman.enemy[enemyId].leg2 = leg2;

                bomberman.enemy[enemyId].animationState = 0;
                bomberman.enemy[enemyId].speed = {x:0,y:0,z:0};
                bomberman.enemy[enemyId].health = 100;
                bomberman.enemy[enemyId].name = 'Player';
            }
        }
    },
    playFootsteps: function(obj) {
        obj.roadwalk = null;
    },
    stopFootsteps: function(obj) {
        obj.footstepstone.stop();
        obj.footstepgrass.stop();
    },
    // character movements
    dist: function(obj1, obj2) {
        return sheetengine.geometry.pointDist(obj1.centerp, obj2.centerp);
    },
    characterAtTargetObj: function(obj) {
        if (!obj.targetObj)
            return false;
        var dist = bomberman.dist(obj.targetObj, obj);
        return dist < 25;
    },
    moveTowardsTarget: function(obj, move) {
        // character constantly falls with gravity
        obj.speed.z += bomberman.gravity;
        var speed = {x:0, y:0, z:obj.speed.z};

        // calculate resulting displacement from orientation of user
        var angle = obj.rot.gamma;
        speed.x = Math.sin(angle) * move;
        speed.y = Math.cos(angle) * move;

        // try moving character
        var targetInfo = bomberman.densityMap.getTargetPoint(obj.centerp, speed, 20, 10);
        var targetp = targetInfo.targetp;
        obj.falling = obj.centerp.z > targetp.z;
        if (targetInfo.stopFall) {
            obj.speed.z = 0;
            obj.falling = 0;
        }
        obj.moved = targetInfo.movex != 0 && targetInfo.movey != 0;
        return targetp;
    },
    moveBypass: function(obj, angle, dist) {
        obj.rotate({x:0, y:0, z:1}, angle);
        var c = obj.centerp;
        var angle = obj.rot.gamma;
        obj.targetDistance = dist;
        obj.target = {x:c.x+(Math.sin(angle))*dist,y:c.y+(Math.cos(angle)*dist),z:0};
        obj.steps = 0;
    },
    turnTowardsTarget: function(obj, targetp) {
        var dx = targetp.x - obj.centerp.x;
        var dy = targetp.y - obj.centerp.y;
        var angle = -Math.atan2(dy, dx) + Math.PI/2;
        obj.setOrientation({alpha: 0, beta: 0, gamma: angle});
    },
    setTarget: function(obj, targetp) {
        if (!targetp)
            return;

        obj.target = targetp;
        obj.finalTarget = targetp;
        var dx = targetp.x - obj.centerp.x;
        var dy = targetp.y - obj.centerp.y;
        obj.targetDistance = Math.sqrt(dx*dx+dy*dy);
        bomberman.turnTowardsTarget(obj, targetp);

        obj.steps = 0;		// steps taken towards the target
        obj.bypass = 0; 	// heading directly towards the target
        obj.bypassSteps = 0;
        obj.falling = 0;
        obj.arrived = 0;
        obj.fighting = 0;
        bomberman.playFootsteps(obj);
    },
    characterArrived: function(obj) {
        // character has arrived to its target / target location
        obj.target = null;
        obj.finalTarget = null;
        obj.animationState = 0;
        bomberman.resetCharacterAnimation(obj);

        if (obj.targetObj) {
            // turn towards target
            bomberman.turnTowardsTarget(obj, obj.targetObj.centerp);

            if (obj.targetObj.name == 'User') {
                obj.fighting = 1;
                obj.fightState = 0;
                obj.fightAnimState = 0;
                obj.damage = bomberman.enemyDamage;
            }
        }
        // pour le multi
        bomberman.sendData();
    },
    moveCharacter: function(obj) {
        // move towards target
        var targetp = bomberman.moveTowardsTarget(obj, bomberman.maxmove);

        if (bomberman.characterAtTargetObj(obj)) {
            bomberman.characterArrived(obj);
            return;
        }

        // moved?
        if (obj.moved) {
            obj.steps += bomberman.maxmove;
            obj.arrived = obj.steps >= obj.targetDistance;
            bomberman.animateCharacter(obj, obj.animationState);
            obj.animationState++;
            obj.setPosition(targetp);
            if (obj == bomberman.user)
                bomberman.moveCamera();
        }

        // arrived to target?
        if (obj.arrived && !obj.falling) {
            if (obj.bypass) {
                obj.bypassSteps += obj.steps;
                if (obj.bypassSteps > bomberman.maxbypass) {
                    // turn to original target
                    bomberman.setTarget(obj, obj.finalTarget);
                } else {
                    // move to left 
                    bomberman.moveBypass(obj, bomberman.bypassAngleLeft, bomberman.bypassDistLeft);
                }
            } else {
                // arrived at final target
                bomberman.characterArrived(obj);
            }
        }

        // bumped into obstacle?
        if (!obj.moved && !obj.falling && !obj.arrived) {
            if (!obj.bypass) {
                // start bypassing
                obj.bypass = 1;
                obj.bypassSteps = 0;
                obj.finalTarget = obj.target;
            }
            // move to right
            bomberman.moveBypass(obj, bomberman.bypassAngleRight, bomberman.bypassDistRight);
        }
    },
    moveCamera: function() {
        // camera is only moved if user moves out of a certain box
        var center = {u:sheetengine.scene.center.u, v:sheetengine.scene.center.v};
        var user = sheetengine.transforms.transformPoint({x:bomberman.user.centerp.x, y:bomberman.user.centerp.y, z:0});

        if (center.u - user.u > bomberman.cameraMaxDistance) {
            center.u = user.u + bomberman.cameraMaxDistance;
        } else if (user.u - center.u > bomberman.cameraMaxDistance) {
            center.u = user.u - bomberman.cameraMaxDistance;
        }
        if (center.v - user.v > bomberman.cameraMaxDistance) {
            center.v = user.v + bomberman.cameraMaxDistance;
        } else if (user.v - center.v > bomberman.cameraMaxDistance) {
            center.v = user.v - bomberman.cameraMaxDistance;
        }
        sheetengine.scene.setCenter(null, center);
    },
    animateCharacter: function(obj, state) {
        // animate character movement
        state = Math.floor( (state % 8) / 2);
        var dir = (state == 0 || state == 3) ? 1 : -1;

        obj.rotateSheet(obj.leg1, {x:0,y:0,z:8}, {x:1,y:0,z:0}, dir * Math.PI/8);
        obj.rotateSheet(obj.leg2, {x:0,y:0,z:8}, {x:1,y:0,z:0}, -dir * Math.PI/8);

        obj.leg1.angle += dir;
        obj.leg2.angle += -dir;
    },
    resetCharacterAnimation: function(obj) {
        obj.rotateSheet(obj.leg1, {x:0,y:0,z:8}, {x:1,y:0,z:0}, -obj.leg1.angle * Math.PI/8);
        obj.rotateSheet(obj.leg2, {x:0,y:0,z:8}, {x:1,y:0,z:0}, -obj.leg2.angle * Math.PI/8);

        obj.leg1.angle = 0;
        obj.leg2.angle = 0;
    },
    setBoundary: function(yardpos) {
        var b = bomberman.boundarySize;
        bomberman.boundary = {
            x1: (yardpos.relyardx - b) * sheetengine.scene.tilewidth,
            y1: (yardpos.relyardy - b) * sheetengine.scene.tilewidth,
            x2: (yardpos.relyardx + b) * sheetengine.scene.tilewidth,
            y2: (yardpos.relyardy + b) * sheetengine.scene.tilewidth
        };
    },
    // drawing
    redraw: function(full) {
        sheetengine.drawing.drawScene(full);

        // static drawing
        bomberman.drawTarget();
        bomberman.drawHealth();
        bomberman.drawBubble();
        if (bomberman.hoveredObj)
            bomberman.highlightObject(bomberman.hoveredObj);
    },
    drawTarget: function() {
        if (!bomberman.user.finalTarget && !bomberman.user.targetObj)
            return;

        var ctx = sheetengine.context;

        ctx.save();
        ctx.scale(1, 0.5);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.2;

        // draw arc at static point
        ctx.strokeStyle = bomberman.user.targetObj ? '#5BB3D3' : '#D6B931';
        ctx.beginPath();
        var p = bomberman.user.targetObj ?
            sheetengine.drawing.getPointuv(bomberman.user.targetObj.centerp) :
            sheetengine.drawing.getPointuv(bomberman.user.finalTarget);
        ctx.arc(p.u, p.v*2, 15, 0, Math.PI*2);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.restore();
    },
    drawHealth: function() {
        for (var i=0;i<sheetengine.objects.length;i++) {
            var obj = sheetengine.objects[i];
            if (obj.name == 'Enemy')
                bomberman.drawHealthForObj(obj);
        }
        bomberman.drawHealthForObj(bomberman.user);
    },
    drawHealthForObj: function(obj) {
        if (obj.health <= 0)
            return;
        var o = sheetengine.drawing.getPointuv(obj.centerp);
        var ctx = sheetengine.context;
        ctx.save();
        ctx.lineWidth = bomberman.linewidth;
        ctx.strokeStyle = '#FFF';
        //ctx.globalAlpha = bomberman.overlayAlpha;
        ctx.strokeRect(o.u,o.v+3,20,3);
        ctx.globalAlpha = 1;
        var h = obj.health / 100 * 18;
        ctx.fillStyle = obj.health <= 20 ? '#F00' : '#0F0';
        ctx.fillRect(o.u+1,o.v+4,h,1);
        ctx.restore();
    },
    drawBubble: function() {
        if (!bomberman.bubbleCenter)
            return;

        var o = sheetengine.drawing.getPointuv(bomberman.bubbleCenter);
        var ctx = sheetengine.context;
        ctx.save();
        ctx.globalAlpha = bomberman.bubbleDim;
        ctx.lineWidth = bomberman.linewidth;
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        var w = 50;
        var h = 30;
        var pu = 30;
        var pv = -70;
        var caretstart = 14;
        var caretw = 6;
        var careth = 10;
        ctx.moveTo(o.u +pu -w,o.v +pv -h);
        ctx.lineTo(o.u +pu -w,o.v +pv +h);

        ctx.lineTo(o.u +pu -w +caretstart, o.v +pv +h);
        ctx.lineTo(o.u +pu -w +caretstart +caretw, o.v +pv +h +careth);
        ctx.lineTo(o.u +pu -w +caretstart +caretw +caretw, o.v +pv +h);

        ctx.lineTo(o.u +pu +w,o.v +pv +h);
        ctx.lineTo(o.u +pu +w,o.v +pv -h);
        ctx.closePath();
        ctx.strokeStyle = '#888';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();

        ctx.fillStyle = '#222';
        ctx.lineWidth = 1;
        ctx.textAlign = 'center';
        var fontSize = 11;
        var lineSize = 13;
        ctx.font = fontSize + "px Arial";
        var startv = bomberman.bubbleMessageLines.length * lineSize / 2  - lineSize / 2 - 3;
        for (var i=0;i<bomberman.bubbleMessageLines.length;i++) {
            var line = bomberman.bubbleMessageLines[i];
            ctx.fillText(line, o.u +pu, o.v +pv -startv + (i*lineSize) );
        }
        ctx.restore();
    },
    highlightObject: function(obj) {
        var pict = bomberman.picts[obj.name];
        if (obj.name.indexOf('Key') != -1)
            pict = bomberman.picts['Key'];
        if (obj.name.indexOf('Gate') != -1) {
            if (obj.opened)
                return;
            if ((obj.name == ('Gate (yellow)') && bomberman.yellowkey) ||
                (obj.name == ('Gate (red)') && bomberman.redkey) ||
                (obj.name == ('Gate (blue)') && bomberman.bluekey))
                pict = bomberman.picts['Gate open'];
            else
                pict = bomberman.picts['Gate closed'];
        }

        var o = sheetengine.drawing.getPointuv(obj.centerp);
        var selrect = bomberman.selRects[obj.name];

        var ctx = sheetengine.context;
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(pict,0,0,16,16,o.u + selrect.px,o.v + selrect.py,16/bomberman.zoom,16/bomberman.zoom);
        ctx.restore();

        ctx.save();
        ctx.lineWidth = bomberman.linewidth;
        ctx.beginPath();
        ctx.strokeStyle = '#FFF';
        ctx.strokeRect(o.u - selrect.w - selrect.x, o.v - selrect.h - selrect.y, selrect.w*2, selrect.h*2);
        ctx.stroke();
        ctx.restore();
    },
    getHoveredObject: function(p) {
        for (var i=0;i<sheetengine.objects.length;i++) {
            var obj = sheetengine.objects[i];
            if (obj.hidden)
                continue;
            if (obj.name == 'Enemy' && obj.health <= 0)
                continue;

            // check is current object is hovered
            var o = sheetengine.drawing.getPointuv(obj.centerp);
        }

        return null;
    },

    // event handlers
    click: function(event) {
        console.log("test")
        if (bomberman.user.killed)
            return;

        if (!bomberman.hoveredObj) {
            // set target location
            var puv = {
                u:event.clientX - sheetengine.canvas.offsetLeft + pageXOffset,
                v:event.clientY - sheetengine.canvas.offsetTop + pageYOffset
            };
            var pxy = sheetengine.transforms.inverseTransformPoint({u:puv.u + sheetengine.scene.center.u, v:puv.v + sheetengine.scene.center.v});
            pxy.x = (pxy.x - sheetengine.scene.center.x) / bomberman.zoom + sheetengine.scene.center.x;
            pxy.y = (pxy.y - sheetengine.scene.center.y) / bomberman.zoom + sheetengine.scene.center.y;

            bomberman.user.targetObj = null;
            bomberman.socket.emit('moveCharac', {userid : userid, target : pxy});
            bomberman.setTarget(bomberman.user, pxy);
        } else {
            // set target object
            bomberman.user.targetObj = bomberman.hoveredObj;
            if (bomberman.characterAtTargetObj(bomberman.user))
                bomberman.characterArrived(bomberman.user);
            else
                bomberman.setTarget(bomberman.user, bomberman.user.targetObj.centerp);
        }
    },
    mousemove: function(event) {
        if (!bomberman.sceneIsReady)
            return;

        // calculate hovered object
        var puv = {
            u:event.clientX - sheetengine.canvas.offsetLeft + pageXOffset,
            v:event.clientY - sheetengine.canvas.offsetTop + pageYOffset
        };
        var w = sheetengine.canvas.width / 2;
        var h = sheetengine.canvas.height / 2;
        puv.u = (puv.u - w) / bomberman.zoom + w;
        puv.v = (puv.v - h) / bomberman.zoom + h;
        bomberman.hoveredObj = bomberman.getHoveredObject(puv);
        if (bomberman.hoveredObj)
            $(sheetengine.canvas).css('cursor','default');
        else
            $(sheetengine.canvas).css('cursor','crosshair');
    },

    // main timer
    timer: function() {
        var startTime = new Date().getTime();

        var sceneChanged = 0;

        // user actions
        if (bomberman.user.target) {
            bomberman.moveCharacter(bomberman.user);
            sceneChanged = 1;
        }

        if (bomberman.user.fighting) {
            sceneChanged = 1;
        }

        // enemy actions

        for (var index in bomberman.enemy){
            var obj = bomberman.enemy[index];
            if (obj.target) {
                bomberman.moveCharacter(obj);
                sceneChanged = 1;
            }
        }

        for (var i=0;i<sheetengine.objects.length;i++) {
            var obj = sheetengine.objects[i];
            if (obj.name != 'Enemy')
                continue;

            if (obj.killed)
                continue;

            if (!obj.fighting && !bomberman.user.killed) {
                var dist = bomberman.dist(obj, bomberman.user);
                if (dist < 100) {
                    obj.targetObj = bomberman.user;
                    bomberman.setTarget(obj, bomberman.user.centerp);
                }
            }
            if (obj.target) {
                bomberman.moveCharacter(obj);
                sceneChanged = 1;
            }
            if (obj.fighting) {
                sceneChanged = 1;
            }
        }

        // gate actions
        for (var i=0;i<sheetengine.objects.length;i++) {
            var obj = sheetengine.objects[i];
            if (!obj.opening)
                continue;

            bomberman.openGate(obj);
            sceneChanged = 1;
        }

        // hovered objects
        if (bomberman.prevhoveredObj != bomberman.hoveredObj) {
            bomberman.prevhoveredObj = bomberman.hoveredObj
            sceneChanged = 1;
        }

        // control message bubble
        if (bomberman.bubbleDim > 0) {
            if (bomberman.bubbleCounter > 0)
                bomberman.bubbleCounter--;
            if (bomberman.bubbleCounter == 0)
                bomberman.bubbleDim -= 0.05;
            if (bomberman.bubbleDim < 0)
                bomberman.bubbleDim = 0;
            sceneChanged = 1;
        }

        if (sceneChanged) {
            sheetengine.calc.calculateChangedSheets();
            bomberman.redraw();
        }

        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        var remaining = bomberman.timerInterval - duration;
        setTimeout(bomberman.timer, remaining > 0 ? remaining : 0);
    },

    //multiplayer
    correctPointBeforeSend: function(point) {
        var relCenter = {x:sheetengine.scene.tilewidth * sheetengine.scene.yardcenterstart.yardx, y:sheetengine.scene.tilewidth*sheetengine.scene.yardcenterstart.yardy, z:0};
        return sheetengine.geometry.addPoint(point, relCenter);
    },
    correctPointAfterReceive: function(point) {
        var relCenter = {x:sheetengine.scene.tilewidth * sheetengine.scene.yardcenterstart.yardx, y:sheetengine.scene.tilewidth*sheetengine.scene.yardcenterstart.yardy, z:0};
        return sheetengine.geometry.subPoint(point, relCenter);
    },
    sendData: function() {
        bomberman.send('data');
    },
    send: function(mode) {
        var centerp = bomberman.correctPointBeforeSend(bomberman.user.centerp);
        var data = { userid : userid, centerp: centerp };

        bomberman.socket.emit(mode, data);
    },
    recvPlayersPositions: function(playersPositions){
        allPlayersPositions = playersPositions;
        if(firstDraw == true){
            firstDraw = false;
            bomberman.sceneReady();
        }

    },
    setRecvs: function() {
        bomberman.socket = io.connect('http://localhost:3000');
        // récupère les positions au premier placement des joueurs sur la map
        bomberman.socket.on('playersPositions', bomberman.recvPlayersPositions);
        // reçoit les mvts des ennemis
        bomberman.socket.on('moveCharac', function (data) {
            bomberman.setTarget(bomberman.enemy[data.userid], data.target)
        });
    }
}

$(function() {
    bomberman.init();
});
