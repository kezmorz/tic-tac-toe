(function() {

	// game module
	const game = (function() {

		// module private members
		const modes = {single: "single", multi: "multi"};
		const symbols = {blank: "blank", X: "X", O: "O"};
		const assets = {
			blank: "assets/resources/symbols/blank.png",
			X: "assets/resources/symbols/cross.png",
			O: "assets/resources/symbols/circle.png"
		}
		const cells = [new Cell(0), new Cell(1), new Cell(2), new  Cell(3), new Cell(4), new Cell(5), new Cell(6), new Cell(7), new Cell(8)];
		const winningCombinations = [
			[0, 1, 2], 
			[3, 4, 5], 
			[6, 7, 8], 
			[0, 3, 6], 
			[1, 4, 7], 
			[2, 5, 8], 
			[0, 4, 8], 
			[2, 4, 6]
		];
		let settings = {
			mode: null,
			players: {
				playerOne: {id: "Player 1", symbol: symbols.blank},
				playerTwo: {id: "Player 2", symbol: symbols.blank}
			}
		};
		let currentPlayer;

		function Cell(id) {

			// set object variables
			this.id = id;
			this.player = {id: "Player Unknown", symbol: symbols.blank};
		}
		Cell.prototype.enable = function() {

			// disable to cell
			$("#cell-0" + this.id).attr("data-enabled", "enabled");
		}
		Cell.prototype.disable = function() {

			// disable to cell
			$("#cell-0" + this.id).attr("data-enabled", "disabled");
		}
		Cell.prototype.reset = function() {

			// reset player
			this.player = {id: "Player Unknown", symbol: symbols.blank};
			// set cell enabled
			this.enable();
			// reset cell img element
			$("#cell-0" + this.id).stop(true, true);
			$("#cell-0" + this.id).css({"display": "", "opacity": ""});
			$("#cell-0" + this.id).empty();
			$("#cell-0" + this.id).append("<img src='" + assets[this.player.symbol] + "'' class='img-fluid'>");
		}
		Cell.prototype.setup = function() {

			// set self variable
			let self = this;

			// set cell img element
			$("#cell-0" + this.id).empty();
			$("#cell-0" + this.id).append("<img src='" + assets[this.player.symbol] + "'' class='img-fluid'>");

			// add click event to respective cell
			$("#cell-0" + this.id).click(function() {
				// select
				self.select();
			});
		}
		Cell.prototype.select = function() {

			// check to see if the cell is enabled
			if ($("#cell-0" + this.id).attr("data-enabled") == "enabled") {
				// set the player
				this.player = currentPlayer;
				// set enabled 
				this.disable();
				// set cell img element
				$("#cell-0" + this.id).empty();
				$("#cell-0" + this.id).append("<img src='" + assets[this.player.symbol] + "' class='img-fluid'>");
				// update the game
				updateGame();
			}
		}
		Cell.prototype.flash = function() {

			// make use of jquery fade in and fade out animations to create a flash effect
			$("#cell-0" + this.id).fadeIn(500)
								.fadeOut(500)
								.fadeIn(500)
								.fadeOut(500)
								.fadeIn(500)
								.fadeOut(500)
								.fadeIn(500);
		}

		function enableCells() {

			// loop through cells array
			$.each(cells, function(index, cell) {
				// enable each cell
				cell.enable();
			});
		}

		function disableCells() {

			// loop through cells array
			$.each(cells, function(index, cell) {
				// disable each cell
				cell.disable();
			});
		}

		function resetCells() {

			// loop through cells array
			$.each(cells, function(index, cell) {
				// reset each cell
				cell.reset();
			});		
		}

		function gameState() {

			// create game state from the cells
			let state = [];
			$.each(cells, function(index, cell) {
				state[index] = cell.player.symbol;
			})
			return state;
		}

		function updateGame() {

			// determine what state the game is in
			let winningCombination = win(gameState(), currentPlayer.symbol);
			if (winningCombination !== null) {
				// here we disable the cells and present the win to the player
				disableCells();
				$.each(winningCombination, function(index, position) {
					cells[position].flash();	
				});
				menu.update(currentPlayer.id + " wins");
			} else if (draw(gameState(), currentPlayer)) {			
				// here we disable the cells and present the draw to the player
				disableCells();
				menu.update("Draw");
			} else {
				// change player and update info
				currentPlayer = currentPlayer === settings.players.playerOne ? settings.players.playerTwo : settings.players.playerOne;
				menu.update(currentPlayer.id + "'s Move");
				// check if the computer needs to make a move
				checkComputerMove();
			}
		}

		function checkComputerMove() {

			// check if we're in single player mode and the current player is player 2 and make a move if it is
			if ((settings.mode === modes.single) && (currentPlayer.id === settings.players.playerTwo.id)) {
				cells[minimaxNextMove(gameState(), currentPlayer).position].select();	
			} 
		}

		function minimaxNextMove(gameState, nextPlayer) {

			// set our required variables
			let options = [];

			// go through each available move
			$.each(gameState, function(index, symbol) {
				if (symbol === symbols.blank) {
					// set our required variables
					let updatedGameState = gameState.slice();
					// update the game state with the new move and analyse
					updatedGameState[index] = nextPlayer.symbol;
					if (win(updatedGameState, nextPlayer.symbol) !== null) {
						// we have a win so add it to the options
						options.push({"position": index, "score": 1});
						return false;
					} else if (draw(updatedGameState)) {
						// we have a draw so add it to the options
						options.push({"position": index, "score": 0});
						return false;
					} else {
						// call the minimax next move function with the new player and add it to the options
						let option = minimaxNextMove(updatedGameState, nextPlayer === settings.players.playerOne ? settings.players.playerTwo : settings.players.playerOne);
						options.push({"position": index, "score": -option.score});
					}
				}
			});

			// sort the options based on highest available scores
			options.sort(function(option1, option2) {
				return option2.score - option1.score;
			});

			// filter array based on highest score and return a random option
			let bestScore = options[0].score;
			let bestOptions = options.filter(function(element) {
				return element.score === bestScore;
			});
			return bestOptions[Math.floor(Math.random() * bestOptions.length)];
		}

		function win(gameState, symbol) {

			// let's loop through the winning combinations array and check if either player has won
			let winningCombination = null;
			$.each(winningCombinations, function(index, combination) {
				if (combination.every(function(position) {
					return gameState[position] === symbol;
				})) {
					winningCombination = combination;
					return false;
				};
			});
			return winningCombination;
		}

		function draw(gameState) {

			// here we can assume that there is no win so it suffices to check if every position has been picked
			return gameState.every(function(symbol) { return symbol !== symbols.blank; });
		}

		function start() {

			// reset and enable the cells
			resetCells();
			enableCells();
			// set the current player and update info
			currentPlayer = settings.players.playerOne.symbol === symbols.X ? settings.players.playerOne : settings.players.playerTwo;
			menu.update(currentPlayer.id + "'s Move");
			// check if the computer needs to make a move
			checkComputerMove();
		}

		function show(visible) {

			// show the game depending on the visibility request
			visible === true ? $("#game").show() : $("#game").hide();
		}

		function initialise(data) {

			// set the game settings from the data received
			settings.mode = modes[data.players];
			settings.players.playerOne.symbol = symbols[data.symbol];
			settings.players.playerTwo.symbol = symbols[data.symbol] === symbols.X ? symbols.O : symbols.X;

			// show and start the game
			start();
		}

		(function() {

			// setup the cells
			$.each(cells, function(index, cell) {
				cell.setup();
			});

			$("#new-game").click(function() {
				show(false);
				menu.show(true);
			});

			$("#restart").click(function() {
				start();
			});

		})();

		return {
			show: show,
			init: initialise
		};

	})();

	// menu module
	const menu = (function() {

		function updateInfo(message) {

			// set the info message
			$("#info").text(message);
		}

		function show(visible) {

			// show the menu depending on the visibility request
			visible === true ? $("#menu").show() : $("#menu").hide();
		}

		(function() {

			$("#menu-form").submit(function(event) {
				// encode form elements as an array of names and values
				var fields = $(this).serializeArray();
				// create an object that contains key and value pairs in the required format and initialise the game
				var data = {};
				$.each(fields, function(index, element) {
					data[element.name] = element.value;
				});
				game.init(data);
				// switch displays
				show(false);
				game.show(true);
				// cancel the default submit
				event.preventDefault();
			});

		})();

		return {
			update: updateInfo, 
			show: show
		}

	})();

})();