"use strict";
/**
 * TIMETABLE SEED SCRIPT
 * File: scripts/seed-timetable-testing.ts
 * Run: npx tsx scripts/seed-timetable-testing.ts
 *
 * Wipes the TimeTable collection and re-seeds Mon–Sun schedules.
 * Requires rooms and courses to already exist (run seed.master.ts first).
 *
 * Uses actual ObjectId refs for room_id and course_id.
 * All times are created as local-time Date objects (consistent with how
 * the backend reads them via minutes-since-midnight arithmetic).
 *
 * Saturday and Sunday classes are mapped to TEST-ROOM-101 so the demo
 * GPS (28.657758679477865, 77.15009598045862) can be used for weekend testing.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
var path_1 = require("path");
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env.local") });
var mongoose_1 = require("mongoose");
var Course_1 = require("@/models/Course");
var TimeTable_1 = require("@/models/TimeTable");
var Room_1 = require("@/models/Room");
// ─── Config ───────────────────────────────────────────────────────────────────
var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found in .env.local");
    process.exit(1);
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Returns a Date for today at the given hour (local time).
 * Stored in MongoDB as UTC — the backend converts back using
 * minutes-since-midnight arithmetic, so the date portion doesn't matter.
 */
function todayAt(hour, minute) {
    if (minute === void 0) { minute = 0; }
    var d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d;
}
// ─── Seed ─────────────────────────────────────────────────────────────────────
function seedTimeTables() {
    return __awaiter(this, void 0, void 0, function () {
        var allRooms, roomMap, _i, allRooms_1, r, r0, r1, r2, rTest, courses, c0, c1, c2, c3, c4Raw, c4, entries, created, byDay, _a, entries_1, e, _b, _c, _d, day, count;
        var _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0: return [4 /*yield*/, TimeTable_1.default.deleteMany({})];
                case 1:
                    _l.sent();
                    console.log("✓ Cleared TimeTable collection");
                    return [4 /*yield*/, Room_1.default.find({})];
                case 2:
                    allRooms = _l.sent();
                    if (allRooms.length < 2) {
                        console.error("✗ Not enough rooms found. Run seed.master.ts first.");
                        process.exit(1);
                    }
                    roomMap = {};
                    for (_i = 0, allRooms_1 = allRooms; _i < allRooms_1.length; _i++) {
                        r = allRooms_1[_i];
                        roomMap[r.room_number] =
                            r;
                    }
                    r0 = (_e = roomMap["101"]) !== null && _e !== void 0 ? _e : allRooms[0];
                    r1 = (_f = roomMap["201"]) !== null && _f !== void 0 ? _f : allRooms[1];
                    r2 = (_h = (_g = roomMap["102"]) !== null && _g !== void 0 ? _g : allRooms[2]) !== null && _h !== void 0 ? _h : allRooms[0];
                    rTest = (_j = roomMap["TEST-ROOM-101"]) !== null && _j !== void 0 ? _j : allRooms[allRooms.length - 1];
                    return [4 /*yield*/, Course_1.default.find({}).limit(5)];
                case 3:
                    courses = _l.sent();
                    if (courses.length < 4) {
                        console.error("✗ Not enough courses found. Run seed.master.ts first.");
                        process.exit(1);
                    }
                    c0 = courses[0], c1 = courses[1], c2 = courses[2], c3 = courses[3], c4Raw = courses[4];
                    c4 = c4Raw !== null && c4Raw !== void 0 ? c4Raw : c0;
                    entries = [
                        // ── Monday ────────────────────────────────────────────────────────────────
                        {
                            room_id: r0._id,
                            course_id: c0._id,
                            day: "Monday",
                            start_time: todayAt(9),
                            end_time: todayAt(10),
                        },
                        {
                            room_id: r0._id,
                            course_id: c1._id,
                            day: "Monday",
                            start_time: todayAt(10),
                            end_time: todayAt(11),
                        },
                        {
                            room_id: r1._id,
                            course_id: c2._id,
                            day: "Monday",
                            start_time: todayAt(12),
                            end_time: todayAt(13),
                        },
                        {
                            room_id: r1._id,
                            course_id: c3._id,
                            day: "Monday",
                            start_time: todayAt(14),
                            end_time: todayAt(15),
                        },
                        // ── Tuesday ───────────────────────────────────────────────────────────────
                        {
                            room_id: r1._id,
                            course_id: c3._id,
                            day: "Tuesday",
                            start_time: todayAt(9),
                            end_time: todayAt(10),
                        },
                        {
                            room_id: r1._id,
                            course_id: c4._id,
                            day: "Tuesday",
                            start_time: todayAt(11),
                            end_time: todayAt(12),
                        },
                        {
                            room_id: r2._id,
                            course_id: c1._id,
                            day: "Tuesday",
                            start_time: todayAt(13),
                            end_time: todayAt(14),
                        },
                        // ── Wednesday ─────────────────────────────────────────────────────────────
                        {
                            room_id: r0._id,
                            course_id: c2._id,
                            day: "Wednesday",
                            start_time: todayAt(10),
                            end_time: todayAt(11),
                        },
                        {
                            room_id: r0._id,
                            course_id: c3._id,
                            day: "Wednesday",
                            start_time: todayAt(11),
                            end_time: todayAt(12),
                        },
                        {
                            room_id: r2._id,
                            course_id: c0._id,
                            day: "Wednesday",
                            start_time: todayAt(14),
                            end_time: todayAt(15),
                        },
                        // ── Thursday ──────────────────────────────────────────────────────────────
                        {
                            room_id: r1._id,
                            course_id: c0._id,
                            day: "Thursday",
                            start_time: todayAt(9),
                            end_time: todayAt(10),
                        },
                        {
                            room_id: r1._id,
                            course_id: c4._id,
                            day: "Thursday",
                            start_time: todayAt(12),
                            end_time: todayAt(13),
                        },
                        {
                            room_id: r2._id,
                            course_id: c2._id,
                            day: "Thursday",
                            start_time: todayAt(14),
                            end_time: todayAt(15),
                        },
                        // ── Friday ────────────────────────────────────────────────────────────────
                        {
                            room_id: r0._id,
                            course_id: c1._id,
                            day: "Friday",
                            start_time: todayAt(10),
                            end_time: todayAt(11),
                        },
                        {
                            room_id: r0._id,
                            course_id: c3._id,
                            day: "Friday",
                            start_time: todayAt(13),
                            end_time: todayAt(14),
                        },
                        {
                            room_id: r2._id,
                            course_id: c0._id,
                            day: "Friday",
                            start_time: todayAt(15),
                            end_time: todayAt(16),
                        },
                        // ── Saturday — mapped to TEST-ROOM-101 for demo GPS testing ───────────────
                        {
                            room_id: rTest._id,
                            course_id: c0._id,
                            day: "Saturday",
                            start_time: todayAt(9),
                            end_time: todayAt(10),
                        },
                        {
                            room_id: rTest._id,
                            course_id: c2._id,
                            day: "Saturday",
                            start_time: todayAt(10),
                            end_time: todayAt(11),
                        },
                        {
                            room_id: r1._id,
                            course_id: c4._id,
                            day: "Saturday",
                            start_time: todayAt(14),
                            end_time: todayAt(15),
                        },
                        // ── Sunday — mapped to TEST-ROOM-101 for demo GPS testing ─────────────────
                        {
                            room_id: rTest._id,
                            course_id: c1._id,
                            day: "Sunday",
                            start_time: todayAt(10),
                            end_time: todayAt(11),
                        },
                        {
                            room_id: rTest._id,
                            course_id: c3._id,
                            day: "Sunday",
                            start_time: todayAt(11),
                            end_time: todayAt(12),
                        },
                        {
                            room_id: rTest._id,
                            course_id: c3._id,
                            day: "Sunday",
                            start_time: todayAt(12),
                            end_time: todayAt(13),
                        },
                        {
                            room_id: rTest._id,
                            course_id: c3._id,
                            day: "Sunday",
                            start_time: todayAt(13),
                            end_time: todayAt(14),
                        },
                    ];
                    return [4 /*yield*/, TimeTable_1.default.insertMany(entries)];
                case 4:
                    created = _l.sent();
                    console.log("\n\u2713 Seeded ".concat(created.length, " timetable entries\n"));
                    byDay = {};
                    for (_a = 0, entries_1 = entries; _a < entries_1.length; _a++) {
                        e = entries_1[_a];
                        byDay[e.day] = ((_k = byDay[e.day]) !== null && _k !== void 0 ? _k : 0) + 1;
                    }
                    for (_b = 0, _c = Object.entries(byDay); _b < _c.length; _b++) {
                        _d = _c[_b], day = _d[0], count = _d[1];
                        console.log("    ".concat(day.padEnd(10), " : ").concat(count, " class").concat(count > 1 ? "es" : ""));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n🗓️   Starting timetable seed (Mon–Sun)...\n");
                    return [4 /*yield*/, mongoose_1.default.connect(MONGODB_URI)];
                case 1:
                    _a.sent();
                    console.log("✓ Connected to MongoDB\n");
                    return [4 /*yield*/, seedTimeTables()];
                case 2:
                    _a.sent();
                    console.log("\n✅  Timetable seed complete!\n");
                    console.log("  Note: Saturday & Sunday classes are in TEST-ROOM-101");
                    console.log("  GPS: 28.657758679477865, 77.15009598045862 (geofence: 100 m)\n");
                    return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error("❌ Timetable seed failed:", err);
    process.exit(1);
});
