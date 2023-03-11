const boardElement = document.getElementById("chessBoard") as HTMLTableElement,
    alg1NameElement = document.getElementById("alg1Name") as HTMLDivElement,
    alg2NameElement = document.getElementById("alg2Name") as HTMLDivElement,
    alg1WinsElelement = document.getElementById("alg1Wins") as HTMLDivElement,
    alg2WinsElelement = document.getElementById("alg2Wins") as HTMLDivElement,
    drawsElement = document.getElementById("draws") as HTMLDivElement;

let board: Board;
let boardDisplay: HTMLTableCellElement[][];
let allPastBoards: {
    [key: string]: number;
} = {};

let winTracker = {
    alg1: 0,
    alg2: 0,
    draws: 0
};

let gameOver = false;

const humanInvolved = false;

let playingAs: Color = WHITE;
let turn: Color = WHITE;

let selectedPiece: Piece | null = null;
let selectedPiecePosition: Position | null = null;
let highlightedPossibleMoves: Position[] = [];
let prevMoveHighlights: Position[] = [];

const alg1: ChessBot = {
    move: aggressivePlus,
    promote: () => QUEEN as PromoteOption
};
const alg2: ChessBot | null = humanInvolved
    ? null
    : {
          move: aggressivePlus,
          promote: randomPromote
      };

function makeMove(move: Move, board: Board, promoteAlg: () => PromoteOption): Board {
    let encoded = encodeBoard(board);
    board.repetitions[encoded] = board.repetitions[encoded] === undefined ? 1 : board.repetitions[encoded] + 1;

    let [fromRow, fromCol] = move.from;
    let [toRow, toCol] = move.to;

    if (board.tiles[toRow][toCol] !== null) {
        if (board.tiles[toRow][toCol]!.type === KING) {
            console.error(move);
            throw new Error("King cannot be captured");
        }
        board.fiftyMoveRuleCounter = 0;
    } else {
        board.fiftyMoveRuleCounter++;
    }

    board.tiles[toRow][toCol] = board.tiles[fromRow][fromCol];
    board.tiles[fromRow][fromCol] = null;

    if (move.piece.type === KING && move.castle !== undefined) {
        board.tiles[move.castle.rookTo[0]][move.castle.rookTo[1]] = board.tiles[move.castle.rookFrom[0]][move.castle.rookFrom[1]];
        board.tiles[move.castle.rookFrom[0]][move.castle.rookFrom[1]] = null;

        if (move.piece.color === WHITE) {
            board.castling[0].kingSide = false;
            board.castling[0].queenSide = false;
        } else {
            board.castling[1].kingSide = false;
            board.castling[1].queenSide = false;
        }
    }

    //Remove castle ability if king or rook moves
    if (move.piece.type === KING) {
        if (move.piece.color === WHITE) {
            board.castling[0].kingSide = false;
            board.castling[0].queenSide = false;
        } else {
            board.castling[1].kingSide = false;
            board.castling[1].queenSide = false;
        }
    } else if (move.piece.type === ROOK) {
        if (move.piece.color === WHITE) {
            if (fromRow === 0 && fromCol === 0) {
                board.castling[0].queenSide = false;
            } else if (fromRow === 0 && fromCol === 7) {
                board.castling[0].kingSide = false;
            }
        } else {
            if (fromRow === 7 && fromCol === 0) {
                board.castling[1].queenSide = false;
            } else if (fromRow === 7 && fromCol === 7) {
                board.castling[1].kingSide = false;
            }
        }
    }

    if (move.piece.type === PAWN && move.enPassantKilledPawn !== undefined) {
        board.tiles[move.enPassantKilledPawn[0]][move.enPassantKilledPawn[1]] = null;
    }

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board.tiles[i][j] !== null && board.tiles[i][j]!.enPassantVulnerable) {
                board.tiles[i][j]!.enPassantVulnerable = false;
            }
        }
    }

    if (move.piece.type === PAWN && Math.abs(toRow - fromRow) === 2 && (fromRow === 1 || fromRow === 6)) {
        board.tiles[toRow][toCol]!.enPassantVulnerable = true;
    }

    if (move.piece.type === PAWN && (toRow === 0 || toRow === 7)) {
        board.tiles[toRow][toCol]!.type = promoteAlg();
    }

    return board;
}

function initBoard() {
    board = {
        tiles: [],
        castling: {
            0: {
                kingSide: true,
                queenSide: true
            },
            1: {
                kingSide: true,
                queenSide: true
            }
        },
        fiftyMoveRuleCounter: 0,
        repetitions: {}
    };
    board.tiles = [];
    for (let i = 0; i < 8; i++) {
        board.tiles[i] = [];
        for (let j = 0; j < 8; j++) {
            board.tiles[i][j] = null;
        }
    }
}

function createStartingBoard() {
    initBoard();

    for (let i = 0; i < 8; i++) {
        board.tiles[1][i] = { type: PAWN, color: WHITE, enPassantVulnerable: false };
        board.tiles[6][i] = { type: PAWN, color: BLACK, enPassantVulnerable: false };

        if (i === 0 || i === 7) {
            board.tiles[0][i] = { type: ROOK, color: WHITE };
            board.tiles[7][i] = { type: ROOK, color: BLACK };
        } else if (i === 1 || i === 6) {
            board.tiles[0][i] = { type: KNIGHT, color: WHITE };
            board.tiles[7][i] = { type: KNIGHT, color: BLACK };
        } else if (i === 2 || i === 5) {
            board.tiles[0][i] = { type: BISHOP, color: WHITE };
            board.tiles[7][i] = { type: BISHOP, color: BLACK };
        } else if (i === 3) {
            board.tiles[0][i] = { type: QUEEN, color: WHITE };
            board.tiles[7][i] = { type: QUEEN, color: BLACK };
        } else if (i === 4) {
            board.tiles[0][i] = { type: KING, color: WHITE };
            board.tiles[7][i] = { type: KING, color: BLACK };
        }
    }
}

function setupBoardDisplay() {
    boardDisplay = [];
    for (let i = 0; i < 8; i++) {
        boardDisplay[i] = [];
        let row = boardElement.insertRow();
        for (let j = 0; j < 8; j++) {
            boardDisplay[i][j] = row.insertCell();
            boardDisplay[i][j].addEventListener("click", handleBoardClick);
        }
    }
}

function handleBoardClick(e: MouseEvent) {
    if (humanInvolved) {
        let rawTarget = e.target as HTMLElement;

        let target: HTMLTableCellElement;
        if (rawTarget instanceof HTMLImageElement) {
            target = rawTarget.parentElement as HTMLTableCellElement;
        } else {
            target = rawTarget as HTMLTableCellElement;
        }

        let displayRow = (target.parentElement as HTMLTableRowElement).rowIndex;
        let displayCol = target.cellIndex;

        let [row, col] = convertDisplayPosition([displayRow, displayCol], WHITE);

        if (selectedPiece !== null && selectedPiecePosition !== null && highlightedPossibleMoves.length > 0) {
            let [highlightRow, highlightCol] = convertDisplayPosition(selectedPiecePosition, WHITE);
            boardDisplay[highlightRow][highlightCol].classList.remove("highlight");

            if (samePos([row, col], selectedPiecePosition)) {
                selectedPiece = null;
                selectedPiecePosition = null;

                for (let move of highlightedPossibleMoves) {
                    let [moveDisplayRow, moveDisplayCol] = convertDisplayPosition(move, WHITE);
                    boardDisplay[moveDisplayRow][moveDisplayCol].classList.remove("possibleMove");
                }
            } else {
                for (let move of highlightedPossibleMoves) {
                    let [moveDisplayRow, moveDisplayCol] = convertDisplayPosition(move, WHITE);
                    boardDisplay[moveDisplayRow][moveDisplayCol].classList.remove("possibleMove");

                    if (samePos(move, [row, col])) {
                        let enPassant: Position | undefined = undefined;
                        if (selectedPiece.type === PAWN && (row === 2 || row === 5) && col !== selectedPiecePosition[1] && board.tiles[row][col] === null) {
                            // en passant
                            enPassant = [selectedPiecePosition[0], col];
                        }

                        let castle: { rookFrom: Position; rookTo: Position } | undefined = undefined;
                        if (selectedPiece.type === KING && Math.abs(col - selectedPiecePosition[1]) === 2) {
                            // castle
                            if (col === 2) {
                                castle = {
                                    rookFrom: [row, 0],
                                    rookTo: [row, 3]
                                };
                            } else if (col === 6) {
                                castle = {
                                    rookFrom: [row, 7],
                                    rookTo: [row, 5]
                                };
                            }
                        }

                        processPlayerMove({
                            piece: selectedPiece,
                            from: selectedPiecePosition,
                            to: [row, col],
                            enPassantKilledPawn: enPassant,
                            castle: castle
                        });
                        renderBoard(WHITE);
                    }
                }
            }
            highlightedPossibleMoves = [];
        } else {
            if (selectedPiece !== null && selectedPiecePosition !== null) {
                let [highlightRow, highlightCol] = convertDisplayPosition(selectedPiecePosition, WHITE);
                boardDisplay[highlightRow][highlightCol].classList.remove("highlight");
            }
            if (board.tiles[row][col] === null || board.tiles[row][col]!.color !== playingAs || (selectedPiecePosition !== null && samePos(selectedPiecePosition, [row, col]))) {
                selectedPiece = null;
                selectedPiecePosition = null;

                for (let move of highlightedPossibleMoves) {
                    let [moveDisplayRow, moveDisplayCol] = convertDisplayPosition(move, WHITE);
                    boardDisplay[moveDisplayRow][moveDisplayCol].classList.remove("possibleMove");
                }
                highlightedPossibleMoves = [];
            } else {
                selectedPiece = board.tiles[row][col];
                selectedPiecePosition = [row, col];
                let [highlightRow, highlightCol] = convertDisplayPosition([row, col], playingAs);
                boardDisplay[highlightRow][highlightCol].classList.add("highlight");
                highlightPossibleMoves([row, col]);
            }
        }
    }
}

function highlightPossibleMoves(pos: Position) {
    let [row, col] = pos;
    let piece = board.tiles[row][col];
    if (piece !== null) {
        let moves = getMoves(piece, [row, col], board);
        for (let move of moves) {
            if (!isLegalMove(move, board)) {
                continue;
            }

            highlightedPossibleMoves.push(move.to);

            let [displayRow, displayCol] = convertDisplayPosition(move.to, playingAs);
            boardDisplay[displayRow][displayCol].classList.add("possibleMove");
        }
    }
}

function highlightPrevMove(move: Move) {
    for (let pos of prevMoveHighlights) {
        let [displayRow, displayCol] = convertDisplayPosition(pos, playingAs);
        boardDisplay[displayRow][displayCol].classList.remove("highlight");
    }

    prevMoveHighlights = [];

    let [fromDisplayRow, fromDisplayCol] = convertDisplayPosition(move.from, playingAs);
    boardDisplay[fromDisplayRow][fromDisplayCol].classList.add("highlight");
    prevMoveHighlights.push(move.from);

    let [toDisplayRow, toDisplayCol] = convertDisplayPosition(move.to, playingAs);
    boardDisplay[toDisplayRow][toDisplayCol].classList.add("highlight");
    prevMoveHighlights.push(move.to);
}

function renderBoard(playingAs: Color = WHITE) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let [boardRow, boardCol] = convertDisplayPosition([i, j], playingAs);
            if (board.tiles[i][j] !== null) {
                boardDisplay[boardRow][boardCol].innerHTML = "";
                boardDisplay[boardRow][boardCol].appendChild(pieceToHTMLImg(board.tiles[i][j]!));
            } else {
                boardDisplay[boardRow][boardCol].innerText = "";
                boardDisplay[boardRow][boardCol].classList.remove("white");
                boardDisplay[boardRow][boardCol].classList.remove("black");
            }
        }
    }

    if (humanInvolved) {
        alg1NameElement.innerText = "Human Player";
        alg2NameElement.innerText = alg1.move.name;
    } else {
        if (alg2 !== null) {
            alg1NameElement.innerText = alg1.move.name;
            alg2NameElement.innerText = alg2.move.name;
        } else {
            alg1NameElement.innerText = "Error: see console";
            alg2NameElement.innerText = "Error: see console";
        }
    }
}

function convertDisplayPosition(pos: Position, playingAs: Color) {
    return [playingAs === WHITE ? 7 - pos[0] : pos[0], playingAs === WHITE ? pos[1] : 7 - pos[1]];
}

function playerPromote(): PromoteOption {
    let input: number = -1;

    while (![QUEEN, ROOK, BISHOP, KNIGHT].includes(input)) {
        input = parseInt(prompt("Promote to (q, r, b, n):") as string);
    }

    return input as PromoteOption;
}

function processPlayerMove(move: Move) {
    if (gameOver || turn !== playingAs) return;

    board = makeMove(move, board, playerPromote);
    highlightPrevMove(move);
    renderBoard(playingAs);

    turn = oppColor(turn);

    if (isCheckmate(board, turn)) {
        gameOver = true;
        if (turn !== playingAs) {
            winTracker.alg1++;

            alg1NameElement.innerText += " - Win";
            alg2NameElement.innerText += " - Loss";

            alg1WinsElelement.innerText = "Wins: " + winTracker.alg1;
        } else {
            winTracker.alg2++;

            alg2NameElement.innerText += " - Win";
            alg1NameElement.innerText += " - Loss";

            alg2WinsElelement.innerText = "Wins: " + winTracker.alg2;
        }
        return;
    }

    if (isDraw(board, turn)) {
        gameOver = true;

        winTracker.draws++;

        alg1NameElement.innerText += " - Draw";
        alg2NameElement.innerText += " - Draw";

        drawsElement.innerText = "Draws: " + winTracker.draws;
        return;
    }

    let algMove = alg1.move(board, turn);
    board = makeMove(algMove, board, alg1.promote);
    highlightPrevMove(algMove);
    renderBoard(playingAs);

    turn = oppColor(turn);

    if (isCheckmate(board, turn)) {
        gameOver = true;
        if (turn !== playingAs) {
            winTracker.alg1++;

            alg1NameElement.innerText += " - Win";
            alg2NameElement.innerText += " - Loss";

            alg1WinsElelement.innerText = "Wins: " + winTracker.alg1;
        } else {
            winTracker.alg2++;

            alg2NameElement.innerText += " - Win";
            alg1NameElement.innerText += " - Loss";

            alg2WinsElelement.innerText = "Wins: " + winTracker.alg2;
        }
        return;
    }

    if (isDraw(board, turn)) {
        gameOver = true;

        winTracker.draws++;

        alg1NameElement.innerText += " - Draw";
        alg2NameElement.innerText += " - Draw";

        drawsElement.innerText = "Draws: " + winTracker.draws;
        return;
    }
}

function processBotVsBot(hyper = false, gameCount = 1) {
    if (humanInvolved) return;

    if (gameOver) return;

    let move: Move;
    if (turn === WHITE) {
        move = alg1.move(board, turn);
        board = makeMove(move, board, alg1.promote);
    } else {
        if (alg2 === null) throw new Error("No second chess bot specified!");
        move = alg2.move(board, turn);
        board = makeMove(move, board, alg2.promote);
    }

    highlightPrevMove(move);
    renderBoard(playingAs);

    turn = oppColor(turn);

    if (isCheckmate(board, turn)) {
        gameOver = true;
        if (turn !== playingAs) {
            winTracker.alg1++;

            alg1NameElement.innerText += " - Win";
            alg2NameElement.innerText += " - Loss";

            alg1WinsElelement.innerText = "Wins: " + winTracker.alg1;
        } else {
            winTracker.alg2++;

            alg2NameElement.innerText += " - Win";
            alg1NameElement.innerText += " - Loss";

            alg2WinsElelement.innerText = "Wins: " + winTracker.alg2;
        }

        gameCount--;

        if (gameCount > 0) {
            return setTimeout(() => {
                resetGame();
                processBotVsBot(hyper, gameCount);
            }, 500);
        }
        return;
    }

    if (isDraw(board, turn)) {
        gameOver = true;

        winTracker.draws++;

        alg1NameElement.innerText += " - Draw";
        alg2NameElement.innerText += " - Draw";

        drawsElement.innerText = "Draws: " + winTracker.draws;

        gameCount--;

        if (gameCount > 0) {
            return setTimeout(() => {
                resetGame();
                processBotVsBot(hyper, gameCount);
            }, 200);
        }
    }

    if (hyper) {
        setTimeout(processBotVsBot, 0, hyper, gameCount);
    }
}

function resetGame() {
    for (let pos of prevMoveHighlights) {
        let [displayRow, displayCol] = convertDisplayPosition(pos, playingAs);
        boardDisplay[displayRow][displayCol].classList.remove("highlight");
    }

    for (let move of highlightedPossibleMoves) {
        let [moveDisplayRow, moveDisplayCol] = convertDisplayPosition(move, WHITE);
        boardDisplay[moveDisplayRow][moveDisplayCol].classList.remove("possibleMove");
    }

    if (selectedPiecePosition !== null) {
        let [selectedDisplayRow, selectedDisplayCol] = convertDisplayPosition(selectedPiecePosition, WHITE);
        boardDisplay[selectedDisplayRow][selectedDisplayCol].classList.remove("highlight");
    }

    prevMoveHighlights = [];
    createStartingBoard();
    gameOver = false;
    turn = WHITE;
    renderBoard(playingAs);
}

function init() {
    createStartingBoard();
    setupBoardDisplay();

    window.addEventListener("keypress", (e) => {
        if (!humanInvolved && e.key === " ") {
            processBotVsBot();
        } else if (!humanInvolved && e.key === "Enter") {
            processBotVsBot(true, e.shiftKey ? 100 : 1);
        } else if (e.key === "r") {
            resetGame();
        }
    });

    renderBoard(WHITE);
}

init();
