const jQueryApp = function () {
    $(document).ready(function () {
        const socket = io('http://localhost:3000/', {
        path: '/socket.io-client',
        transports: ['websocket']});
        // Canvas Selectors and Settings
        const game = $('#game')
        game.oncontextmenu = function(event) {
            event.preventDefault();
        }
        const canvas = $('#ctx')
        const canvasEnt = $('#ctx-ent')
        canvas[0].width = $(window).width()
        canvas[0].height = $(window).height()
        canvasEnt[0].width = $(window).width()
        canvasEnt[0].height = $(window).height()
        const ctx = canvas[0].getContext("2d")
        const ctxEnt = canvasEnt[0].getContext("2d")
        ctx.font = '30px Arial'
        ctxEnt.font = '30px Arial'
        // Chat Selectors and Settings
        const chatText = $('#chat-text')
        const chatInput = $('#chat-input')
        const chatForm = $('#chat-form')
        // Images
        const Img = {}
        Img.player = new Image()
        Img.player.src = '/client/images/player1.png'
        Img.bullet = new Image()
        Img.bullet.src = '/client/images/bullet.png'

        class Map {
            constructor(params) {
                this.name = params.name
                this.img = new Image()
                this.img.src = params.imgSrc
                Map.list[this.name] = this
            }

            static render() {
                const player = Player.list[selfId]
                const xpos = canvas[0].width / 2 - player.x
                const ypos = canvas[0].height / 2 - player.y
                const mapImg = Map.list[player.map].img
                const imgWidth = mapImg.width
                const imgHeight = mapImg.height
                console.log("width:", imgWidth)
                console.log("height:", imgHeight)
                ctx.drawImage(mapImg, 0, 0, imgWidth, imgHeight, xpos, ypos, imgWidth * 4, imgHeight * 4)
                ctx.mozImageSmoothingEnabled = false;
                ctx.msImageSmoothingEnabled = false;
                ctx.imageSmoothingEnabled = false;
            }
        }
        Map.list = {}
        // ------------------------------------------------ Game Logic ------------------------------------------------
        let selfId = null
        class Player {
            constructor(params) {
                this.id = params.id
                this.number = params.number
                this.x = params.x
                this.y = params.y
                this.currentHp = params.currentHp
                this.maxHp = params.maxHp
                this.score = params.score
                this.map = params.map
                this.mouseAngle = params.mouseAngle;
                this.spriteCalc = params.spriteCalc;
                this.bulletAngle = params.bulletAngle;
                this.playername = 'Joel'
                Player.list[this.id] = this
            }

            render() {
                if (Player.list[selfId].map !== this.map) {
                    return
                }
                const xpos = this.x - Player.list[selfId].x + canvasEnt[0].width / 2
                const ypos = this.y - Player.list[selfId].y + canvasEnt[0].height / 2
                // hp bar
                const currentHpWidth = 40 * this.currentHp / this.maxHp
                ctxEnt.fillStyle = "darkred"
                ctxEnt.fillRect(xpos - 40 / 2, ypos - 70 / 2, 40, 4)
                ctxEnt.fillStyle = "darkblue"
                ctxEnt.fillRect(xpos - 40 / 2, ypos - 70 / 2, currentHpWidth, 4)

                //player Name
                ctxEnt.fillStyle = 'black';
                ctxEnt.font = '18px Arial'
                ctxEnt.fillText(this.playername,xpos - 40/2,ypos - 40);

                const playerSpriteWidth = Img.player.width / 1.2
                const playerSpriteHeight = Img.player.height / 1.5
                const frameWidth = Img.player.width/3;
                const frameHeight = Img.player.height/3.9;
                let directionMod = 3;
                let angle = this.mouseAngle;

                if(angle < 0)
                angle = 360 + angle;

                if(angle >= 45 && angle < 135 )
                    directionMod = 2;
                else if(angle >= 135 && angle < 225 )
                    directionMod = 1;
                else if(angle >= 225 && angle < 315 )
                    directionMod = 0;

                let walkingMod = Math.floor(this.spriteCalc) % 3;


                ctxEnt.drawImage(Img.player, walkingMod*frameWidth, directionMod*frameHeight, frameWidth, frameHeight,
                    xpos - playerSpriteWidth / 2, ypos - playerSpriteHeight / 2, playerSpriteWidth, playerSpriteHeight)
            }
        }
        Player.list = {}

        class Projectile {
            constructor(params) {
                this.id = params.id
                this.x = params.x
                this.y = params.y
                this.map = params.map
                Projectile.list[this.id] = this
            }
            render() {
                if (Player.list[selfId].map !== this.map) {
                    return
                }
                const imgWidth = Img.bullet.width/2
                const imgHeight = Img.bullet.height/2
                const xpos = this.x - Player.list[selfId].x + canvasEnt[0].width / 2
                const ypos = this.y - Player.list[selfId].y + canvasEnt[0].height / 2

                ctxEnt.drawImage(Img.bullet, 0, 0, Img.bullet.width, Img.bullet.height,
                    xpos - imgWidth / 2, ypos - imgHeight / 2, imgWidth, imgHeight)
            }
        }
        Projectile.list = {}

        socket.on('init', function (data) {
            const parsedData = JSON.parse(data)
            console.log("init:", parsedData)
            if (parsedData.selfId) { selfId = parsedData.selfId }
            for (let i = 0; i < parsedData.players.length; i++) {
                new Player(parsedData.players[i])
            }
            for (let i = 0; i < parsedData.projectiles.length; i++) {
                new Projectile(parsedData.projectiles[i])
            }
            if (parsedData.maps) {
                for (let i = 0; i < parsedData.maps.length; i++)  {
                    new Map(parsedData.maps[i])
                }
            }
        })

        socket.on('update', function (data) {
            const parsedData = JSON.parse(data)
            // console.log("update", parsedData)
            if (parsedData.players)
                for (let i = 0; i < parsedData.players.length; i++) {
                    const newPlayerData = parsedData.players[i]
                    const player = Player.list[newPlayerData.id]
                    if (player) {
                        if (newPlayerData.x !== undefined) {
                            player.x = newPlayerData.x }
                        if (newPlayerData.y !== undefined) {
                            player.y = newPlayerData.y }
                        if (newPlayerData.currentHp !== undefined) {
                            player.currentHp = newPlayerData.currentHp }
                        if (newPlayerData.score !== undefined) {
                            player.score = newPlayerData.score }
                        if (newPlayerData.mouseAngle !== undefined)
                          player.mouseAngle = newPlayerData.mouseAngle;
                        if (newPlayerData.spriteCalc !== undefined)
                          player.spriteCalc = newPlayerData.spriteCalc;
                        if (newPlayerData.bulletAngle !== undefined)
                          player.bulletAngle = newPlayerData.bulletAngle;
                    }
                }
            for (let i = 0; i < parsedData.projectiles.length; i++) {
                const newProjectileData = parsedData.projectiles[i]
                const projectile = Projectile.list[newProjectileData.id]
                if (projectile) {
                    if (newProjectileData.x !== undefined) { projectile.x = newProjectileData.x }
                    if (newProjectileData.y !== undefined) { projectile.y = newProjectileData.y }
                }
            }
        })

        socket.on('remove', function (data) {
            const parsedData = JSON.parse(data)
            // console.log('remove: ', parsedData)
            for (let i = 0; i < parsedData.players.length; i++) {
                delete Player.list[parsedData.players[i]]
            }
            for (let i = 0; i < parsedData.projectiles.length; i++) {
                delete Projectile.list[parsedData.projectiles[i]]
            }
        })
        // ------------------------------------------------ Event Handlers ------------------------------------------------
        // Helpers for syntactic sugar
        const focusCanvas = () => { game.focus() }
        const blurCanvas = () => { game.blur() }
        const focusChat = () => { chatInput.focus() }
        const blurChat = () => { chatInput.blur() }
        const pressing = (action, bool) => { socket.emit('keyPress', { inputId: action, state: bool }) }
        const cancelPlayerKeyPress = function () {
            pressing('left', false)
            pressing('right', false)
            pressing('up', false)
            pressing('down', false)
            pressing('leftClick', false)
        }
        // TODO: focus canvas on tabbing into game
        $(window).focus(() => { focusCanvas() })
        $(window).blur(function () {
            cancelPlayerKeyPress()
            blurCanvas()
        })
        // TODO: cancel all player actions when tabbing out of the game
        // TODO: make chat scroll to bottom when new messages arrive
        $(window).resize(function () {
            canvas[0].height = $(window).height()
            canvas[0].width = $(window).width()
            canvasEnt[0].height = $(window).height()
            canvasEnt[0].width = $(window).width()
        })


        game.on("keydown", function (event) {
            if (event.which === 65) { pressing('left', true) }
            else if (event.which === 68) { pressing('right', true) }
            else if (event.which === 87) { pressing('up', true) }
            else if (event.which === 83) { pressing('down', true) }
            else if (event.which === 13) {
                event.preventDefault()
                cancelPlayerKeyPress()
                blurCanvas()
                focusChat()
            }
        })

        game.on("keyup", function (event) {
            if (event.which === 65) { pressing('left', false) }
            else if (event.which === 68) { pressing('right', false) }
            else if (event.which === 87) { pressing('up', false) }
            else if (event.which === 83) { pressing('down', false) }
        })

        game.mousedown(function (event) { if (event.which === 1) {
            const x = -canvas[0].width / 2 + event.clientX - 8
            const y = -canvas[0].height / 2 + event.clientY - 8
            const angle = Math.floor(Math.atan2(y, x) / Math.PI * 180)
            socket.emit('keyPress', {inputId: 'leftClick', state:true, angle:angle}); } })

        game.mouseup(function (event) { if (event.which === 1) { pressing('leftClick', false) } })

        game.mousemove(function (event) {
            const x = -canvas[0].width / 2 + event.clientX - 8
            const y = -canvas[0].height / 2 + event.clientY - 8
            const angle = Math.floor(Math.atan2(y, x) / Math.PI * 180)
            socket.emit('keyPress', { inputId: 'mouseAngle', state: angle })
        })
        // Chat
        chatForm.submit(function (event) {
            event.preventDefault()
            if (chatInput.val()[0] === '/') { socket.emit('evalMessage', { text: chatInput.val().slice(1) }) }
            else { socket.emit('sendMessage', { text: chatInput.val() }) }
            chatInput.val("")
            blurChat()
            focusCanvas()
        })

        socket.on('addToChat', function (data) { $("<div>").text(data).appendTo(chatText) })
        socket.on('evalAnswer', function (data) { console.log(data) })
        // ------------------------------------------------ Render Logic ------------------------------------------------
        const renderGame = () => {
            if (selfId) {
                ctx.clearRect(0, 0, canvas[0].width, canvas[0].height)
                ctxEnt.clearRect(0, 0, canvas[0].width, canvas[0].height)
                Map.render()
                for (let i in Player.list) { Player.list[i].render() }
                for (let i in Projectile.list) { Projectile.list[i].render() }
            }
            requestAnimationFrame(renderGame)
        }
        // initialize draw on page load
        focusCanvas()
        renderGame()
    })
}

export default jQueryApp