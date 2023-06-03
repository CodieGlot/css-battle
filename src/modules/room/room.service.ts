/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { WsResponse } from '@nestjs/websockets';
import type Ably from 'ably';
import axios from 'axios';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as puppeteer from 'puppeteer';
import { Repository } from 'typeorm';

import { PlayerStatus, QuestionDifficulty, RoomStatus } from '../../constants';
import { QuestionsService } from '../questions/questions.service';
import type { User } from '../users/entities';
import type { QuestionQuantitiesDto, WorkDto } from './dto/request';
import { PointInfoDto } from './dto/response/point-info.dto';
import { Player, Room } from './entities';

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
        @InjectRepository(Player) private readonly playerRepository: Repository<Player>,
        private readonly questionsService: QuestionsService
    ) {}

    activeRooms: Set<string> = new Set();

    async createRoom(ably: Ably.Types.RealtimePromise, user: User): Promise<WsResponse<unknown>> {
        let roomCode: string;

        do {
            roomCode = Math.floor(100_000 + Math.random() * 900_000).toString();
        } while (this.activeRooms.has(roomCode));

        const roomEntity = this.roomRepository.create({
            roomCode,
            playerHostId: user.id,
            players: [this.createPlayerFromUser(user)]
        });

        const room = await this.roomRepository.save(roomEntity);

        this.activeRooms.add(roomCode);

        const channel = ably.channels.get(roomCode);

        await channel.publish('roomUpdated', { room, message: `Room ${roomCode} has been created` });

        return {
            event: 'roomUpdated',
            data: {
                room,
                message: `Room ${roomCode} has been created`
            }
        };
    }

    async joinRoom(
        ably: Ably.Types.RealtimePromise,
        user: User,
        roomCode: string
    ): Promise<WsResponse<unknown>> {
        const room = await this.findRoomByRoomCode(roomCode);

        if (this.hasPlayerBeenInRoom(user.id, room.players)) {
            throw new BadRequestException('User has already been in this room');
        }

        if (room.status === RoomStatus.PROGRESS) {
            throw new BadRequestException('Room has already been in progress');
        } else if (room.players.length === 5) {
            throw new BadRequestException('Room has been full');
        }

        const channel = ably.channels.get(roomCode);

        room.players.push(this.createPlayerFromUser(user));

        await this.roomRepository.save(room);

        await channel.publish('roomUpdated', {
            room,
            message: `Player ${user.username} has joined the room`
        });

        return {
            event: 'roomUpdated',
            data: { room, message: `Player ${user.username} has joined the room` }
        };
    }

    async leaveRoom(
        ably: Ably.Types.RealtimePromise,
        user: User,
        roomCode: string
    ): Promise<WsResponse<unknown>> {
        const room = await this.findRoomByRoomCode(roomCode);

        if (!this.hasPlayerBeenInRoom(user.id, room.players)) {
            throw new BadRequestException('Player has not been in this room');
        }

        const channel = ably.channels.get(roomCode);

        if (room.players.length === 1) {
            this.activeRooms.delete(roomCode);

            await this.roomRepository.delete({ id: room.id });

            return { event: 'roomUpdated', data: { message: `Room ${roomCode} has been deleted` } };
        }

        const playerIndex = this.findIndexOfPlayer(user.id, room.players);

        await this.playerRepository.delete({ id: room.players[playerIndex].id });

        room.players.splice(playerIndex, 1);

        room.playerHostId = room.players[0].userId;

        await this.roomRepository.save(room);

        await channel.publish('roomUpdated', {
            room,
            message: `Player ${user.username} has left the room`
        });

        return {
            event: 'roomUpdated',
            data: { room, message: `Player ${user.username} has left the room` }
        };
    }

    async updateStatus(
        ably: Ably.Types.RealtimePromise,
        user: User,
        roomCode: string,
        status: PlayerStatus
    ): Promise<WsResponse<unknown>> {
        const room = await this.findRoomByRoomCode(roomCode);

        if (!this.hasPlayerBeenInRoom(user.id, room.players)) {
            throw new BadRequestException('Player has not been in this room');
        }

        const channel = ably.channels.get(roomCode);

        const playerIndex = this.findIndexOfPlayer(user.id, room.players);

        let message = '';

        switch (status) {
            case PlayerStatus.READY: {
                message = `Player ${user.username} readies to start`;

                break;
            }

            case PlayerStatus.WAITING: {
                message = `Player ${user.username} has changed to waiting state`;

                break;
            }
        }

        room.players[playerIndex].status = status;

        await this.playerRepository.update({ id: room.players[playerIndex].id }, { status });

        await channel.publish('roomUpdated', { room, message });

        return {
            event: 'roomUpdated',
            data: { room, message }
        };
    }

    async startGame(
        ably: Ably.Types.RealtimePromise,
        user: User,
        roomCode: string,
        dto: QuestionQuantitiesDto
    ): Promise<WsResponse<unknown>> {
        const total = dto.numOfEasy + dto.numOfMedium + dto.numOfHard;

        if (total > 10) {
            throw new BadRequestException('Total number of questions should not be more than 10');
        } else if (total === 0) {
            throw new BadRequestException('There should be at least 1 question to start');
        }

        const room = await this.findRoomByRoomCode(roomCode);

        if (!this.hasPlayerBeenInRoom(user.id, room.players)) {
            throw new BadRequestException('Player has not been in this room');
        }

        const channel = ably.channels.get(roomCode);

        if (user.id === room.playerHostId) {
            if (!room.players.every((player) => player.status === PlayerStatus.READY)) {
                throw new BadRequestException('All players have not ready to start');
            }

            const easyQuestions = await this.questionsService.getRandomQuestions(
                dto.numOfEasy,
                QuestionDifficulty.EASY
            );

            const mediumQuestions = await this.questionsService.getRandomQuestions(
                dto.numOfMedium,
                QuestionDifficulty.MEDIUM
            );

            const hardQuestions = await this.questionsService.getRandomQuestions(
                dto.numOfHard,
                QuestionDifficulty.HARD
            );

            room.questions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

            for (let i = 0; i !== room.players.length; i++) {
                room.players[i].points = room.questions.map(
                    (question) =>
                        new PointInfoDto({
                            questionId: question.id,
                            point: 0,
                            time: 0
                        })
                );
            }

            room.status = RoomStatus.PROGRESS;

            await this.roomRepository.save(room);

            await channel.publish('gameStarted', {
                room,
                message: 'Questions have been generated successfully'
            });

            return {
                event: 'gameStarted',
                data: { room, message: 'Questions have been generated successfully' }
            };
        }

        throw new BadRequestException('User is not the host of this room');
    }

    async checkWork(dto: WorkDto) {
        const question = await this.questionsService.findQuestionById(dto.questionId);

        return this.compareImage(dto.htmlCode, question.imageUrl);
    }

    async submitWork(ably: Ably.Types.RealtimePromise, user: User, roomCode: string, dto: WorkDto) {
        let room = await this.findRoomByRoomCode(roomCode);

        if (!this.hasPlayerBeenInRoom(user.id, room.players)) {
            throw new BadRequestException('Player has not been in this room');
        }

        const channel = ably.channels.get(roomCode);

        const playerIndex = this.findIndexOfPlayer(user.id, room.players);

        const player = await this.playerRepository.findOne({ where: { id: room.players[playerIndex].id } });

        const questionIndex = this.findIndexOfQuestion(dto.questionId, player?.points as PointInfoDto[]);

        const point = await this.checkWork(dto);

        if (questionIndex === -1) {
            throw new BadRequestException('Invalid question id');
        } else {
            if (player?.points[questionIndex].time === 0) {
                player.points[questionIndex].point = point;
                player.points[questionIndex].time = dto.time;

                room.players[playerIndex].points[questionIndex].point = point;
                room.players[playerIndex].points[questionIndex].time = dto.time;
            } else {
                throw new BadRequestException('Player has already submitted this question.');
            }
        }

        const leaderboard = this.createLeaderboard(room.players);

        if (player.points.every((pointInfo) => pointInfo.time !== 0)) {
            player.status = PlayerStatus.FINISHED;

            await this.playerRepository.save(player);

            const summary = this.createSummary(room.players);

            const rank = this.findRankOfSummary(summary, player.username);

            room = await this.findRoomByRoomCode(roomCode);

            if (room.players.every((p) => p.status === PlayerStatus.FINISHED)) {
                room.status = RoomStatus.CLOSED;

                await this.roomRepository.save(room);

                await channel.publish('playerFinished', {
                    leaderboard,
                    summary,
                    message: 'All players have finished the game'
                });

                return {
                    event: 'playerFinished',
                    data: { leaderboard, summary, message: 'All players have finished the game' }
                };
            }

            await this.playerRepository.update({ id: player.id }, { points: player.points });

            await channel.publish('playerFinished', {
                leaderboard,
                summary,
                message: `Player ${player.username} currently ranked ${rank} in the game`
            });

            return {
                event: 'playerFinished',
                data: {
                    leaderboard,
                    summary,
                    message: `Player ${player.username} currently ranked ${rank} in the game`
                }
            };
        }

        await this.playerRepository.update({ id: player.id }, { points: player.points });

        await channel.publish('progressUpdated', {
            leaderboard,
            message: `Player ${player.username} has earned ${point} points to question ${questionIndex + 1}`
        });

        return {
            event: 'progressUpdated',
            data: {
                leaderboard,
                message: `Player ${player.username} has earned ${point} points to question ${
                    questionIndex + 1
                }`
            }
        };
    }

    createLeaderboard(players: Player[]) {
        const leaderboard: any[] = [];

        for (let i = 0; i !== players[0].points.length; i++) {
            const rank: any[] = [],
                unfinished: any[] = [];

            for (const player of players) {
                if (player.points[i].time === 0) {
                    unfinished.push({
                        username: player.username,
                        point: player.points[i].point,
                        time: player.points[i].time
                    });

                    continue;
                }

                rank.push({
                    username: player.username,
                    point: player.points[i].point,
                    time: player.points[i].time
                });
            }

            rank.sort((a, b) => (a.point === b.point ? a.time - b.time : b.point - a.point));
            leaderboard.push([...rank, ...unfinished]);
        }

        return leaderboard;
    }

    createSummary(players: Player[]) {
        const summary: any[] = [];

        for (const player of players) {
            let point = 0,
                time = 0;

            for (const pointInfo of player.points) {
                point += pointInfo.point;
                time += pointInfo.time;
            }

            summary.push({
                username: player.username,
                status: player.status,
                point,
                time
            });
        }

        summary.sort((a, b) => (a.point === b.point ? a.time - b.time : b.point - a.point));

        return summary;
    }

    findRankOfSummary(summary: any[], username: string) {
        let rank = 0;

        for (let i = 0; i !== summary.length; i++) {
            if (summary[i].username === username) {
                rank = i + 1;
                break;
            }
        }

        // eslint-disable-next-line unicorn/no-nested-ternary
        return rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;
    }

    createPlayerFromUser(user: User) {
        return this.playerRepository.create({
            userId: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl
        });
    }

    hasPlayerBeenInRoom(id: string, players: Player[]) {
        for (const player of players) {
            if (id === player.userId) {
                return true;
            }
        }

        return false;
    }

    findIndexOfPlayer(id: string, players: Player[]) {
        for (let i = 0; i !== players.length; i++) {
            if (id === players[i].userId) {
                return i;
            }
        }

        return -1;
    }

    findIndexOfQuestion(id: string, points: PointInfoDto[]) {
        for (let i = 0; i !== points.length; i++) {
            if (id === points[i].questionId) {
                return i;
            }
        }

        return -1;
    }

    async findRoomByRoomCode(roomCode: string) {
        const room = await this.roomRepository.findOne({
            relations: {
                players: true
            },
            where: { roomCode }
        });

        if (!room) {
            throw new BadRequestException('Room not found');
        }

        return room;
    }

    async getResultBoard(roomCode: string) {
        const room = await this.findRoomByRoomCode(roomCode);

        return {
            leaderboard: this.createLeaderboard(room.players),
            summary: this.createSummary(room.players)
        };
    }

    async convertHtmlToImage(htmlCode: string): Promise<Buffer> {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({
            width: 400,
            height: 300,
            deviceScaleFactor: 1
        });
        await page.setContent(htmlCode);
        const imgBuffer = await page.screenshot({
            encoding: 'binary'
        });
        await browser.close();

        return imgBuffer;
    }

    async compareImage(htmlCode: string, imageUrl: string): Promise<number> {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const imgDestination = PNG.sync.read(response.data);
        const imgCheckBuffer = await this.convertHtmlToImage(htmlCode);
        const imgCheck = PNG.sync.read(imgCheckBuffer);

        if (imgDestination.width !== imgCheck.width || imgDestination.height !== imgCheck.height) {
            return 0; // Return 0 if image sizes do not match
        }

        const { width, height, data } = imgDestination;
        const diff = new PNG({ width, height });
        const difference = pixelmatch(data, imgCheck.data, diff.data, width, height, {
            threshold: 0.1
        });

        const compatibility = 100 - (difference * 100) / (width * height);

        return Number(compatibility.toFixed(2));
    }
}
