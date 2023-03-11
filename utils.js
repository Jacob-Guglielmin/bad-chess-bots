"use strict";
const PAWN = 0;
const KNIGHT = 1;
const BISHOP = 2;
const ROOK = 3;
const QUEEN = 4;
const KING = 5;
const WHITE = 0;
const BLACK = 1;
function getAllLegalMoves(board, color) {
    let moves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board.tiles[i][j] !== null && board.tiles[i][j].color === color) {
                let pieceMoves = getMoves(board.tiles[i][j], [i, j], board);
                for (let move of pieceMoves) {
                    if (isLegalMove(move, board)) {
                        moves.push(move);
                    }
                }
            }
        }
    }
    return moves;
}
function isLegalMove(move, board) {
    if (move.piece.type === PAWN && move.to[1] !== move.from[1] && (board.tiles[move.to[0]][move.to[1]] === null || board.tiles[move.to[0]][move.to[1]].color === move.piece.color)) {
        return false;
    }
    return !isCheck(makeMove(move, cloneBoard(board), () => QUEEN), move.piece.color);
}
function isDraw(board, withToMove) {
    return board.repetitions[encodeBoard(board)] >= 3 || board.fiftyMoveRuleCounter === 100 || (!isCheck(board, withToMove) && getAllLegalMoves(board, withToMove).length === 0);
}
function isCheckmate(board, against) {
    if (!isCheck(board, against)) {
        return false;
    }
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board.tiles[i][j] !== null && board.tiles[i][j].color === against) {
                let moves = getMoves(board.tiles[i][j], [i, j], board);
                for (let move of moves) {
                    if (move.piece.type === PAWN && move.to[1] !== move.from[1] && (board.tiles[move.to[0]][move.to[1]] === null || board.tiles[move.to[0]][move.to[1]].color === move.piece.color)) {
                        continue;
                    }
                    let newBoard = makeMove(move, cloneBoard(board), () => QUEEN);
                    if (!isCheck(newBoard, against)) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}
function isCheck(board, against) {
    let kingPosition = null;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board.tiles[i][j] !== null && board.tiles[i][j].type === KING && board.tiles[i][j].color === against) {
                kingPosition = [i, j];
            }
        }
    }
    if (kingPosition === null) {
        throw new Error("King not found");
    }
    return isAttacked(board, kingPosition, against);
}
function isAttacked(board, position, pieceColorAttacked, log = false) {
    for (let i = position[0] + 1; i < 8; i++) {
        if (board.tiles[i][position[1]] !== null) {
            if (board.tiles[i][position[1]].color !== pieceColorAttacked && (board.tiles[i][position[1]].type === QUEEN || board.tiles[i][position[1]].type === ROOK)) {
                if (log)
                    console.log("a");
                return true;
            }
            break;
        }
    }
    for (let i = position[0] - 1; i >= 0; i--) {
        if (board.tiles[i][position[1]] !== null) {
            if (board.tiles[i][position[1]].color !== pieceColorAttacked && (board.tiles[i][position[1]].type === QUEEN || board.tiles[i][position[1]].type === ROOK)) {
                if (log)
                    console.log("b");
                return true;
            }
            break;
        }
    }
    for (let i = position[1] + 1; i < 8; i++) {
        if (board.tiles[position[0]][i] !== null) {
            if (board.tiles[position[0]][i].color !== pieceColorAttacked && (board.tiles[position[0]][i].type === QUEEN || board.tiles[position[0]][i].type === ROOK)) {
                if (log)
                    console.log("c");
                return true;
            }
            break;
        }
    }
    for (let i = position[1] - 1; i >= 0; i--) {
        if (board.tiles[position[0]][i] !== null) {
            if (board.tiles[position[0]][i].color !== pieceColorAttacked && (board.tiles[position[0]][i].type === QUEEN || board.tiles[position[0]][i].type === ROOK)) {
                if (log)
                    console.log("d");
                return true;
            }
            break;
        }
    }
    for (let i = position[0] + 1, j = position[1] + 1; i < 8 && j < 8; i++, j++) {
        if (board.tiles[i][j] !== null) {
            if (board.tiles[i][j].color !== pieceColorAttacked && (board.tiles[i][j].type === QUEEN || board.tiles[i][j].type === BISHOP)) {
                if (log)
                    console.log("e");
                return true;
            }
            break;
        }
    }
    for (let i = position[0] - 1, j = position[1] - 1; i >= 0 && j >= 0; i--, j--) {
        if (board.tiles[i][j] !== null) {
            if (board.tiles[i][j].color !== pieceColorAttacked && (board.tiles[i][j].type === QUEEN || board.tiles[i][j].type === BISHOP)) {
                if (log)
                    console.log("f");
                return true;
            }
            break;
        }
    }
    for (let i = position[0] + 1, j = position[1] - 1; i < 8 && j >= 0; i++, j--) {
        if (board.tiles[i][j] !== null) {
            if (board.tiles[i][j].color !== pieceColorAttacked && (board.tiles[i][j].type === QUEEN || board.tiles[i][j].type === BISHOP)) {
                if (log)
                    console.log("g");
                return true;
            }
            break;
        }
    }
    for (let i = position[0] - 1, j = position[1] + 1; i >= 0 && j < 8; i--, j++) {
        if (board.tiles[i][j] !== null) {
            if (board.tiles[i][j].color !== pieceColorAttacked && (board.tiles[i][j].type === QUEEN || board.tiles[i][j].type === BISHOP)) {
                if (log)
                    console.log("h");
                return true;
            }
            break;
        }
    }
    for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
            if (Math.abs(i) + Math.abs(j) === 3 && position[0] + i >= 0 && position[0] + i < 8 && position[1] + j >= 0 && position[1] + j < 8) {
                if (board.tiles[position[0] + i][position[1] + j] !== null && board.tiles[position[0] + i][position[1] + j].type === KNIGHT && board.tiles[position[0] + i][position[1] + j].color !== pieceColorAttacked) {
                    if (log)
                        console.log("i");
                    return true;
                }
            }
        }
    }
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i !== 0 || j !== 0) {
                if (position[0] + i >= 0 && position[0] + i < 8 && position[1] + j >= 0 && position[1] + j < 8) {
                    if (board.tiles[position[0] + i][position[1] + j] !== null && board.tiles[position[0] + i][position[1] + j].type === KING && board.tiles[position[0] + i][position[1] + j].color !== pieceColorAttacked) {
                        if (log)
                            console.log("yay");
                        return true;
                    }
                }
            }
        }
    }
    if (pieceColorAttacked === WHITE) {
        if (position[0] + 1 < 8 && position[1] + 1 < 8 && board.tiles[position[0] + 1][position[1] + 1] !== null && board.tiles[position[0] + 1][position[1] + 1].type === PAWN && board.tiles[position[0] + 1][position[1] + 1].color !== pieceColorAttacked) {
            if (log)
                console.log("j");
            return true;
        }
        if (position[0] + 1 < 8 && position[1] - 1 >= 0 && board.tiles[position[0] + 1][position[1] - 1] !== null && board.tiles[position[0] + 1][position[1] - 1].type === PAWN && board.tiles[position[0] + 1][position[1] - 1].color !== pieceColorAttacked) {
            if (log)
                console.log("k");
            return true;
        }
    }
    else {
        if (position[0] - 1 >= 0 && position[1] + 1 < 8 && board.tiles[position[0] - 1][position[1] + 1] !== null && board.tiles[position[0] - 1][position[1] + 1].type === PAWN && board.tiles[position[0] - 1][position[1] + 1].color !== pieceColorAttacked) {
            if (log)
                console.log("l");
            return true;
        }
        if (position[0] - 1 >= 0 && position[1] - 1 >= 0 && board.tiles[position[0] - 1][position[1] - 1] !== null && board.tiles[position[0] - 1][position[1] - 1].type === PAWN && board.tiles[position[0] - 1][position[1] - 1].color !== pieceColorAttacked) {
            if (log)
                console.log("m");
            return true;
        }
    }
    return false;
}
function getMoves(piece, from, board) {
    switch (piece.type) {
        case PAWN:
            return getPawnMoves(piece, from, board);
        case KNIGHT:
            return getKnightMoves(piece, from, board);
        case BISHOP:
            return getBishopMoves(piece, from, board);
        case ROOK:
            return getRookMoves(piece, from, board);
        case QUEEN:
            return getQueenMoves(piece, from, board);
        case KING:
            return getKingMoves(piece, from, board);
    }
}
function getPawnMoves(piece, from, board) {
    let moves = [];
    let [row, col] = from;
    let direction = piece.color === WHITE ? 1 : -1;
    if (board.tiles[row + direction][col] === null) {
        moves.push({
            piece,
            from,
            to: [row + direction, col]
        });
        if ((row === 1 && piece.color === WHITE) || (row === 6 && piece.color === BLACK)) {
            if (board.tiles[row + direction * 2][col] === null) {
                moves.push({
                    piece,
                    from,
                    to: [row + direction * 2, col]
                });
            }
        }
    }
    if (col - 1 >= 0) {
        moves.push({
            piece,
            from,
            to: [row + direction, col - 1]
        });
    }
    if (col + 1 < 8) {
        moves.push({
            piece,
            from,
            to: [row + direction, col + 1]
        });
    }
    if (col - 1 >= 0 && board.tiles[row][col - 1] !== null && board.tiles[row][col - 1].type === PAWN && board.tiles[row][col - 1].color !== piece.color && board.tiles[row][col - 1].enPassantVulnerable) {
        moves.push({
            piece,
            from,
            to: [row + direction, col - 1],
            enPassantKilledPawn: [row, col - 1]
        });
    }
    if (col + 1 < 8 && board.tiles[row][col + 1] !== null && board.tiles[row][col + 1].type === PAWN && board.tiles[row][col + 1].color !== piece.color && board.tiles[row][col + 1].enPassantVulnerable) {
        moves.push({
            piece,
            from,
            to: [row + direction, col + 1],
            enPassantKilledPawn: [row, col + 1]
        });
    }
    return moves;
}
function getKnightMoves(piece, from, board) {
    let moves = [];
    let [row, col] = from;
    let directions = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1]
    ];
    for (let direction of directions) {
        let [rowOffset, colOffset] = direction;
        if (row + rowOffset >= 0 && row + rowOffset < 8 && col + colOffset >= 0 && col + colOffset < 8) {
            if (board.tiles[row + rowOffset][col + colOffset] === null || board.tiles[row + rowOffset][col + colOffset].color !== piece.color) {
                moves.push({
                    piece,
                    from,
                    to: [row + rowOffset, col + colOffset]
                });
            }
        }
    }
    return moves;
}
function getBishopMoves(piece, from, board) {
    let moves = [];
    let [row, col] = from;
    let directions = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
    ];
    for (let direction of directions) {
        let [rowOffset, colOffset] = direction;
        let i = 1;
        while (row + rowOffset * i >= 0 && row + rowOffset * i < 8 && col + colOffset * i >= 0 && col + colOffset * i < 8) {
            if (board.tiles[row + rowOffset * i][col + colOffset * i] === null) {
                moves.push({
                    piece,
                    from,
                    to: [row + rowOffset * i, col + colOffset * i]
                });
            }
            else {
                if (board.tiles[row + rowOffset * i][col + colOffset * i].color !== piece.color) {
                    moves.push({
                        piece,
                        from,
                        to: [row + rowOffset * i, col + colOffset * i]
                    });
                }
                break;
            }
            i++;
        }
    }
    return moves;
}
function getRookMoves(piece, from, board) {
    let moves = [];
    let [row, col] = from;
    let directions = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0]
    ];
    for (let direction of directions) {
        let [rowOffset, colOffset] = direction;
        let i = 1;
        while (row + rowOffset * i >= 0 && row + rowOffset * i < 8 && col + colOffset * i >= 0 && col + colOffset * i < 8) {
            if (board.tiles[row + rowOffset * i][col + colOffset * i] === null) {
                moves.push({
                    piece,
                    from,
                    to: [row + rowOffset * i, col + colOffset * i]
                });
            }
            else {
                if (board.tiles[row + rowOffset * i][col + colOffset * i].color !== piece.color) {
                    moves.push({
                        piece,
                        from,
                        to: [row + rowOffset * i, col + colOffset * i]
                    });
                }
                break;
            }
            i++;
        }
    }
    return moves;
}
function getQueenMoves(piece, from, board) {
    return getBishopMoves(piece, from, board).concat(getRookMoves(piece, from, board));
}
function getKingMoves(piece, from, board) {
    let moves = [];
    let [row, col] = from;
    let directions = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
    ];
    for (let direction of directions) {
        let [rowOffset, colOffset] = direction;
        if (row + rowOffset >= 0 && row + rowOffset < 8 && col + colOffset >= 0 && col + colOffset < 8) {
            if (board.tiles[row + rowOffset][col + colOffset] === null || board.tiles[row + rowOffset][col + colOffset].color !== piece.color) {
                moves.push({
                    piece,
                    from,
                    to: [row + rowOffset, col + colOffset]
                });
            }
        }
    }
    if (board.castling[piece.color].kingSide) {
        if (board.tiles[row][col + 1] === null && board.tiles[row][col + 2] === null && !isAttacked(board, [row, col + 1], piece.color)) {
            moves.push({
                piece,
                from,
                to: [row, col + 2],
                castle: {
                    rookFrom: [row, 7],
                    rookTo: [row, 5]
                }
            });
        }
    }
    if (board.castling[piece.color].queenSide) {
        if (board.tiles[row][col - 1] === null && board.tiles[row][col - 2] === null && board.tiles[row][col - 3] === null && !isAttacked(board, [row, col - 1], piece.color)) {
            moves.push({
                piece,
                from,
                to: [row, col - 2],
                castle: {
                    rookFrom: [row, 0],
                    rookTo: [row, 3]
                }
            });
        }
    }
    return moves;
}
function pieceToHTMLImg(piece) {
    let img = document.createElement("img");
    let pieceType;
    switch (piece.type) {
        case PAWN:
            pieceType = "p";
            break;
        case KNIGHT:
            pieceType = "n";
            break;
        case BISHOP:
            pieceType = "b";
            break;
        case ROOK:
            pieceType = "r";
            break;
        case QUEEN:
            pieceType = "q";
            break;
        case KING:
            pieceType = "k";
            break;
    }
    img.src = "assets/" + pieceType + (piece.color === WHITE ? "w" : "b") + ".svg";
    return img;
}
function colorName(color) {
    return color === WHITE ? "White" : "Black";
}
function samePos(a, b) {
    return a[0] === b[0] && a[1] === b[1];
}
function oppColor(color) {
    return color === WHITE ? BLACK : WHITE;
}
function cloneBoard(board) {
    let newBoard = {
        tiles: [],
        castling: {
            0: {
                kingSide: board.castling[0].kingSide,
                queenSide: board.castling[0].queenSide
            },
            1: {
                kingSide: board.castling[1].kingSide,
                queenSide: board.castling[1].queenSide
            }
        },
        fiftyMoveRuleCounter: board.fiftyMoveRuleCounter,
        repetitions: Object.assign({}, board.repetitions)
    };
    for (let row = 0; row < 8; row++) {
        let newRow = [];
        for (let square = 0; square < 8; square++) {
            newRow.push(board.tiles[row][square] === null ? null : Object.assign({}, board.tiles[row][square]));
        }
        newBoard.tiles.push(newRow);
    }
    return newBoard;
}
function pieceValue(pieceType) {
    switch (pieceType) {
        case PAWN:
            return 1;
        case KNIGHT:
            return 2.9;
        case BISHOP:
            return 3;
        case ROOK:
            return 5;
        case QUEEN:
            return 9;
        case KING:
            return 100;
    }
}
function encodeBoard(board) {
    let encoded = parseInt((board.castling[0].kingSide ? "1" : "0") + (board.castling[0].queenSide ? "1" : "0") + (board.castling[1].kingSide ? "1" : "0") + (board.castling[1].queenSide ? "1" : "0"), 2).toString(16);
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            let square = "";
            if (board.tiles[i][j] === null) {
                square = "1111";
            }
            else {
                square += board.tiles[i][j].color;
                square += (board.tiles[i][j].type + 1).toString(2).padStart(3, "0");
            }
            encoded += parseInt(square, 2).toString(16);
        }
    }
    return encoded;
}
function decodeBoard(encoded) {
    let castling = {
        0: {
            kingSide: (parseInt(encoded[0], 16) & 8) !== 0,
            queenSide: (parseInt(encoded[0], 16) & 4) !== 0
        },
        1: {
            kingSide: (parseInt(encoded[0], 16) & 2) !== 0,
            queenSide: (parseInt(encoded[0], 16) & 1) !== 0
        }
    };
    let tiles = [];
    for (let i = 0; i < 8; i++) {
        let row = [];
        for (let j = 0; j < 8; j++) {
            let square = parseInt(encoded[1 + i * 8 + j], 16)
                .toString(2)
                .padStart(4, "0");
            if (square === "1111") {
                row.push(null);
            }
            else {
                let color = parseInt(square[0]);
                let type;
                type = (parseInt(square.slice(1), 2) - 1);
                row.push({ color, type });
            }
        }
        tiles.push(row);
    }
    return { tiles, castling, fiftyMoveRuleCounter: 0, repetitions: {} };
}
