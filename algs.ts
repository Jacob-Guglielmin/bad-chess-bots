// ===================
//     RANDOM MOVE
// ===================
function randomMove(board: Board, color: Color): Move {
    let moves = getAllLegalMoves(board, color);
    return moves[Math.floor(Math.random() * moves.length)];
}

function randomPromote(): PromoteOption {
    let options: PromoteOption[] = [QUEEN, ROOK, BISHOP, KNIGHT];
    return options[Math.floor(Math.random() * options.length)];
}

// ===================
//     PUSH FORWARD
// ===================
function pushForward(board: Board, color: Color): Move {
    let moves = getAllLegalMoves(board, color);

    let direction = color === WHITE ? 1 : -1;

    let bestDist = -Infinity;
    let bestMoves: Move[] = [];

    for (let i = 0; i < moves.length; i++) {
        let move = moves[i];
        let distTravelled = (move.to[0] - move.from[0]) * direction;

        if (distTravelled > bestDist) {
            bestDist = distTravelled;
            bestMoves = [move];
        } else if (distTravelled === bestDist) {
            bestMoves.push(move);
        }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// ===================
//     AGGRESSIVE
// ===================
function aggressive(board: Board, color: Color): Move {
    let moves = getAllLegalMoves(board, color);

    let direction = color === WHITE ? 1 : -1;

    let movesDescribed: {
        move: Move;
        score: number;
        check: boolean;
        distTravelled: number;
    }[] = [];

    for (let i = 0; i < moves.length; i++) {
        let move = moves[i];

        let newBoard = makeMove(move, cloneBoard(board), () => QUEEN);

        if (isCheckmate(newBoard, oppColor(color))) {
            return move;
        } else {
            let score = -0.5;

            if (board.tiles[move.to[0]][move.to[1]] !== null) {
                score = pieceValue(board.tiles[move.to[0]][move.to[1]]!.type);
            }

            if (move.enPassantKilledPawn !== undefined) {
                score += pieceValue(PAWN);
            }

            if (isAttacked(newBoard, [move.to[0], move.to[1]], color)) {
                score -= pieceValue(move.piece.type);
            }

            let check = isCheck(newBoard, oppColor(color));

            let distTravelled = (move.to[0] - move.from[0]) * direction;

            movesDescribed.push({
                move,
                score,
                check,
                distTravelled
            });
        }
    }

    let bestMoveDescription = {
        score: -Infinity,
        check: false,
        distTravelled: -Infinity
    };
    let bestMoves: Move[] = [];

    for (let moveDescription of movesDescribed) {
        if (moveDescription.score > bestMoveDescription.score) {
            bestMoveDescription.score = moveDescription.score;
            bestMoveDescription.check = moveDescription.check;
            bestMoveDescription.distTravelled = moveDescription.distTravelled;
            bestMoves = [moveDescription.move];
        } else if (moveDescription.score === bestMoveDescription.score) {
            if (moveDescription.check && !bestMoveDescription.check) {
                bestMoveDescription.check = moveDescription.check;
                bestMoveDescription.distTravelled = moveDescription.distTravelled;
                bestMoves = [moveDescription.move];
            } else if (moveDescription.check === bestMoveDescription.check) {
                if (moveDescription.distTravelled > bestMoveDescription.distTravelled) {
                    bestMoveDescription.distTravelled = moveDescription.distTravelled;
                    bestMoves = [moveDescription.move];
                } else if (moveDescription.distTravelled === bestMoveDescription.distTravelled) {
                    bestMoves.push(moveDescription.move);
                }
            }
        }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// ===================
//   AGGRESSIVE PLUS
// ===================
function aggressivePlus(board: Board, color: Color): Move {
    let moves = getAllLegalMoves(board, color);

    let direction = color === WHITE ? 1 : -1;

    let movesDescribed: {
        move: Move;
        score: number;
        check: boolean;
        centerControl: number;
        distTravelled: number;
        canLoseOnNextMove: boolean;
        draw: boolean;
    }[] = [];

    for (let i = 0; i < moves.length; i++) {
        let move = moves[i];

        let newBoard = makeMove(move, cloneBoard(board), () => QUEEN);

        if (isCheckmate(newBoard, oppColor(color))) {
            return move;
        } else {
            let score = -0.5;

            if (board.tiles[move.to[0]][move.to[1]] !== null) {
                score = pieceValue(board.tiles[move.to[0]][move.to[1]]!.type);
            }

            if (move.enPassantKilledPawn !== undefined) {
                score += pieceValue(PAWN);
            }

            if (isAttacked(newBoard, [move.to[0], move.to[1]], color)) {
                score -= pieceValue(move.piece.type);
            }

            // Slightly encourage castling
            if (move.castle !== undefined) {
                score += 0.5;
            }

            let highestAttackedValue = 0;
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if (newBoard.tiles[i][j] !== null && newBoard.tiles[i][j]!.color === color && isAttacked(newBoard, [i, j], color)) {
                        if (pieceValue(newBoard.tiles[i][j]!.type) > highestAttackedValue) {
                            highestAttackedValue = pieceValue(newBoard.tiles[i][j]!.type);
                        }
                    }
                }
            }
            score -= highestAttackedValue;

            let check = isCheck(newBoard, oppColor(color));

            let draw = isDraw(newBoard, oppColor(color));

            let distTravelled = (move.to[0] - move.from[0]) * direction;

            let centerControlBefore = 0;
            getMoves(move.piece, move.from, newBoard).forEach((move) => {
                let distTravelled = (move.to[0] - move.from[0]) * direction;

                if (distTravelled > 0 && move.to[1] > 1 && move.to[1] < 6 && ((direction === 1 && (move.to[0] === 4 || move.to[0] === 5)) || (direction === -1 && (move.to[0] === 3 || move.to[0] === 2)))) {
                    centerControlBefore++;
                }
            });
            if (move.to[1] === 3 || move.to[1] === 4) centerControlBefore += 0.5;

            let centerControl = 0;
            if (distTravelled > 0) {
                getMoves(newBoard.tiles[move.to[0]][move.to[1]]!, move.to, newBoard).forEach((move) => {
                    let distTravelled = (move.to[0] - move.from[0]) * direction;

                    if (distTravelled > 0 && move.to[1] > 1 && move.to[1] < 6 && ((direction === 1 && (move.to[0] === 4 || move.to[0] === 5)) || (direction === -1 && (move.to[0] === 3 || move.to[0] === 2)))) {
                        centerControl++;
                    }
                });
                if (move.to[1] === 3 || move.to[1] === 4) centerControl += 0.5;
            }

            centerControl = Math.max(0, centerControl - centerControlBefore);

            let opponentNextMoves = getAllLegalMoves(newBoard, oppColor(color));
            let canLoseOnNextMove = false;

            for (let j = 0; j < opponentNextMoves.length; j++) {
                let opponentNextMove = opponentNextMoves[j];

                let opponentNewBoard = makeMove(opponentNextMove, cloneBoard(newBoard), () => QUEEN);

                if (isCheckmate(opponentNewBoard, color)) {
                    canLoseOnNextMove = true;
                    break;
                }
            }

            movesDescribed.push({
                move,
                score,
                check,
                centerControl,
                distTravelled,
                canLoseOnNextMove,
                draw
            });
        }
    }

    movesDescribed.sort((a, b) => {
        if (!a.canLoseOnNextMove && b.canLoseOnNextMove) {
            return -1;
        } else if (a.canLoseOnNextMove && !b.canLoseOnNextMove) {
            return 1;
        } else {
            if (!a.draw && b.draw) {
                return -1;
            } else if (a.draw && !b.draw) {
                return 1;
            } else {
                if (a.score > b.score) {
                    return -1;
                } else if (a.score < b.score) {
                    return 1;
                } else {
                    if (a.check && !b.check) {
                        return -1;
                    } else if (!a.check && b.check) {
                        return 1;
                    } else {
                        if (a.centerControl > b.centerControl) {
                            return -1;
                        } else if (a.centerControl < b.centerControl) {
                            return 1;
                        } else {
                            if (a.distTravelled > b.distTravelled) {
                                return -1;
                            } else if (a.distTravelled < b.distTravelled) {
                                return 1;
                            } else {
                                return 0;
                            }
                        }
                    }
                }
            }
        }
    });

    let bestMoves = [movesDescribed[0]];
    for (let i = 1; i < movesDescribed.length; i++) {
        if (movesDescribed[i].canLoseOnNextMove === bestMoves[0].canLoseOnNextMove && movesDescribed[i].score === bestMoves[0].score && movesDescribed[i].check === bestMoves[0].check && movesDescribed[i].centerControl === bestMoves[0].centerControl && movesDescribed[i].distTravelled === bestMoves[0].distTravelled && movesDescribed[i].draw === bestMoves[0].draw) {
            bestMoves.push(movesDescribed[i]);
        } else {
            break;
        }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)].move;
}

// ===================
//   BLOCK OPPONENT
// ===================
function blockOpponent(board: Board, color: Color): Move {
    let moves = getAllLegalMoves(board, color);

    let leastOptions = Infinity;
    let bestMoves: Move[] = [];

    for (let move of moves) {
        let newBoard = makeMove(move, cloneBoard(board), () => QUEEN);
        let oppMoves = getAllLegalMoves(newBoard, oppColor(color));

        if (oppMoves.length < leastOptions) {
            leastOptions = oppMoves.length;
            bestMoves = [move];
        } else if (oppMoves.length === leastOptions) {
            bestMoves.push(move);
        }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// ===================
//      DEFENSIVE
// ===================
function defensive(board: Board, color: Color): Move {
    let moves = getAllLegalMoves(board, color);

    let minDistSum = Infinity;
    let bestMoves: Move[] = [];

    for (let move of moves) {
        let newBoard = makeMove(move, cloneBoard(board), () => QUEEN);

        let kingPos = [0, 0];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (newBoard.tiles[i][j] !== null && newBoard.tiles[i][j]!.type === KING && newBoard.tiles[i][j]!.color === color) {
                    kingPos = [i, j];
                }
            }
        }

        let distSum = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (newBoard.tiles[i][j] !== null && newBoard.tiles[i][j]!.color === color) {
                    distSum += Math.abs(i - kingPos[0]) + Math.abs(j - kingPos[1]);
                }
            }
        }

        if (distSum < minDistSum) {
            minDistSum = distSum;
            bestMoves = [move];
        } else if (distSum === minDistSum) {
            bestMoves.push(move);
        }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// ===================
//     THROW ASAP
// ===================
function throwAsap(board: Board, color: Color): Move {
    let moves = getAllLegalMoves(board, color);

    let direction = color === WHITE ? 1 : -1;

    let movesDescribed: {
        move: Move;
        score: number;
        check: boolean;
        distTravelled: number;
        loseOnNextMoveOptions: number;
        DrawOnNextMoveOptions: number;
    }[] = [];

    for (let i = 0; i < moves.length; i++) {
        let move = moves[i];

        let newBoard = makeMove(move, cloneBoard(board), () => QUEEN);

        if (isCheckmate(newBoard, oppColor(color))) {
            movesDescribed.push({
                score: Infinity,
                check: true,
                distTravelled: Infinity,
                loseOnNextMoveOptions: -Infinity,
                DrawOnNextMoveOptions: Infinity,
                move
            });
        } else {
            let score = -0.5;

            if (board.tiles[move.to[0]][move.to[1]] !== null) {
                score = pieceValue(board.tiles[move.to[0]][move.to[1]]!.type);
            }

            if (move.enPassantKilledPawn !== undefined) {
                score += pieceValue(PAWN);
            }

            if (isAttacked(newBoard, [move.to[0], move.to[1]], color)) {
                score -= pieceValue(move.piece.type);
            }

            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if (newBoard.tiles[i][j] !== null && newBoard.tiles[i][j]!.color === color && isAttacked(newBoard, [i, j], color)) {
                        score -= pieceValue(newBoard.tiles[i][j]!.type);
                    }
                }
            }

            let check = isCheck(newBoard, oppColor(color));

            let distTravelled = (move.to[0] - move.from[0]) * direction;

            let opponentNextMoves = getAllLegalMoves(newBoard, oppColor(color));
            let loseOnNextMoveOptions = 0;
            let DrawOnNextMoveOptions = 0;

            for (let j = 0; j < opponentNextMoves.length; j++) {
                let opponentNextMove = opponentNextMoves[j];

                let opponentNewBoard = makeMove(opponentNextMove, cloneBoard(newBoard), () => QUEEN);

                if (isCheckmate(opponentNewBoard, color)) {
                    loseOnNextMoveOptions++;
                }

                if (isDraw(opponentNewBoard, color)) {
                    DrawOnNextMoveOptions++;
                }
            }

            movesDescribed.push({
                move,
                score,
                check,
                distTravelled,
                loseOnNextMoveOptions,
                DrawOnNextMoveOptions
            });
        }
    }

    let worstMoveDescription = {
        score: Infinity,
        check: true,
        distTravelled: Infinity,
        loseOnNextMoveOptions: -Infinity,
        DrawOnNextMoveOptions: Infinity
    };
    let worstMoves: Move[] = [];

    for (let moveDescription of movesDescribed) {
        if (moveDescription.loseOnNextMoveOptions > worstMoveDescription.loseOnNextMoveOptions) {
            worstMoveDescription.score = moveDescription.score;
            worstMoveDescription.check = moveDescription.check;
            worstMoveDescription.distTravelled = moveDescription.distTravelled;
            worstMoveDescription.loseOnNextMoveOptions = moveDescription.loseOnNextMoveOptions;
            worstMoveDescription.DrawOnNextMoveOptions = moveDescription.DrawOnNextMoveOptions;
            worstMoves = [moveDescription.move];
        } else if (moveDescription.loseOnNextMoveOptions === worstMoveDescription.loseOnNextMoveOptions) {
            if (moveDescription.DrawOnNextMoveOptions < worstMoveDescription.DrawOnNextMoveOptions) {
                worstMoveDescription.score = moveDescription.score;
                worstMoveDescription.check = moveDescription.check;
                worstMoveDescription.distTravelled = moveDescription.distTravelled;
                worstMoveDescription.DrawOnNextMoveOptions = moveDescription.DrawOnNextMoveOptions;
            } else if (moveDescription.DrawOnNextMoveOptions === worstMoveDescription.DrawOnNextMoveOptions) {
                if (moveDescription.score < worstMoveDescription.score) {
                    worstMoveDescription.score = moveDescription.score;
                    worstMoveDescription.check = moveDescription.check;
                    worstMoveDescription.distTravelled = moveDescription.distTravelled;
                    worstMoves = [moveDescription.move];
                } else if (moveDescription.score === worstMoveDescription.score) {
                    if (!moveDescription.check && worstMoveDescription.check) {
                        worstMoveDescription.check = moveDescription.check;
                        worstMoveDescription.distTravelled = moveDescription.distTravelled;
                        worstMoves = [moveDescription.move];
                    } else if (moveDescription.check === worstMoveDescription.check) {
                        if (moveDescription.distTravelled < worstMoveDescription.distTravelled) {
                            worstMoveDescription.distTravelled = moveDescription.distTravelled;
                            worstMoves = [moveDescription.move];
                        } else if (moveDescription.distTravelled === worstMoveDescription.distTravelled) {
                            worstMoves.push(moveDescription.move);
                        }
                    }
                }
            }
        }
    }

    return worstMoves[Math.floor(Math.random() * worstMoves.length)];
}

// ===================
//      KING RACE
// ===================
function kingRace(board: Board, color: Color): Move {
    let moves = getAllLegalMoves(board, color);

    let direction = color === WHITE ? 1 : -1;

    // Find the king
    let kingPos: [number, number] = [-1, -1];
    outer: for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board.tiles[i][j] !== null && board.tiles[i][j]!.color === color && board.tiles[i][j]!.type === KING) {
                kingPos = [i, j];
                break outer;
            }
        }
    }

    // Play a random move if goal has been reached
    if ((color === WHITE && kingPos[0] === 7) || (color === BLACK && kingPos[0] === 0)) {
        let noKingBackwardsMoves: Move[] = moves.filter((move) => move.piece.type !== KING || move.to[0] - move.from[0] !== -direction);
        if (noKingBackwardsMoves.length > 0) {
            return noKingBackwardsMoves[Math.floor(Math.random() * noKingBackwardsMoves.length)];
        }
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // Advance the king
    let advanceKingMoves: Move[] = [];
    for (let move of moves) {
        if (move.piece.type === KING && move.to[0] - move.from[0] === direction) {
            advanceKingMoves.push(move);
        }
    }
    if (advanceKingMoves.length > 0) {
        return advanceKingMoves[Math.floor(Math.random() * advanceKingMoves.length)];
    }

    // Get out of the way of the king
    let outOfWayMoves: Move[] = [];
    for (let move of moves) {
        if (move.from[0] === kingPos[0] + direction && Math.abs(move.from[1] - kingPos[1]) <= 1) {
            outOfWayMoves.push(move);
        }
    }
    if (outOfWayMoves.length > 0) {
        return outOfWayMoves[Math.floor(Math.random() * outOfWayMoves.length)];
    }

    // Don't get in the way of the king
    let bestMoveStats = {
        distMovedToSide: -Infinity,
        distMovedForward: Infinity,
        isKing: true,
        isInFrontOfKing: true,
        takesPieceInWay: false
    };
    let bestMoves: Move[] = [];
    for (let move of moves) {
        let distToSideBefore = Math.min(move.from[1], 7 - move.from[1]);
        let distToSideAfter = Math.min(move.to[1], 7 - move.to[1]);

        let distMovedToSide = distToSideBefore - distToSideAfter;

        let distMovedForward = (move.to[0] - move.from[0]) * direction;

        let isKing = move.piece.type === KING;

        let isInFrontOfKing = move.to[0] === kingPos[0] + direction && Math.abs(move.to[1] - kingPos[1]) <= 1;

        let takesPieceInWay = board.tiles[move.to[0]][move.to[1]] !== null && move.to[0] > kingPos[0] && Math.abs(move.to[1] - kingPos[1]) <= 1;

        if (!isKing && bestMoveStats.isKing) {
            bestMoveStats.distMovedToSide = distMovedToSide;
            bestMoveStats.distMovedForward = distMovedForward;
            bestMoveStats.isKing = isKing;
            bestMoveStats.isInFrontOfKing = isInFrontOfKing;
            bestMoveStats.takesPieceInWay = takesPieceInWay;
            bestMoves = [move];
        } else if (isKing === bestMoveStats.isKing) {
            if (takesPieceInWay && !bestMoveStats.takesPieceInWay) {
                bestMoveStats.distMovedToSide = distMovedToSide;
                bestMoveStats.distMovedForward = distMovedForward;
                bestMoveStats.isInFrontOfKing = isInFrontOfKing;
                bestMoveStats.takesPieceInWay = takesPieceInWay;
                bestMoves = [move];
            } else if (takesPieceInWay === bestMoveStats.takesPieceInWay) {
                if (!isInFrontOfKing && bestMoveStats.isInFrontOfKing) {
                    bestMoveStats.distMovedToSide = distMovedToSide;
                    bestMoveStats.distMovedForward = distMovedForward;
                    bestMoveStats.isInFrontOfKing = isInFrontOfKing;
                    bestMoves = [move];
                } else if (isInFrontOfKing === bestMoveStats.isInFrontOfKing) {
                    if (distMovedToSide > bestMoveStats.distMovedToSide) {
                        bestMoveStats.distMovedToSide = distMovedToSide;
                        bestMoveStats.distMovedForward = distMovedForward;
                        bestMoves = [move];
                    } else if (distMovedToSide === bestMoveStats.distMovedToSide) {
                        if (distMovedForward < bestMoveStats.distMovedForward) {
                            bestMoveStats.distMovedForward = distMovedForward;
                            bestMoves = [move];
                        } else if (distMovedForward === bestMoveStats.distMovedForward) {
                            bestMoves.push(move);
                        }
                    }
                }
            }
        }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
