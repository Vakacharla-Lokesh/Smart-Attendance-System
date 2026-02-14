// lib/location-utils.ts
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";
import TimeTable from "@/models/TimeTable";

interface CoordinateDistance {
  distance: number; // in meters
  isWithinGeofence: boolean;
}

/**
 * Calculate Haversine distance between two coordinates
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Verify if student is within geofence of a specific room
 */
export async function verifyLocationInGeofence(
  room_id: string,
  student_latitude: number,
  student_longitude: number,
): Promise<CoordinateDistance> {
  try {
    await connectDB();

    const room = await Room.findById(room_id).lean().exec();

    if (!room) {
      throw new Error(`Room not found: ${room_id}`);
    }

    // Type assertion for lean document
    const roomData = room as any;

    const distance = calculateDistance(
      roomData.latitude,
      roomData.longitude,
      student_latitude,
      student_longitude,
    );

    return {
      distance,
      isWithinGeofence: distance <= roomData.geofence_radius,
    };
  } catch (error) {
    console.error("Error verifying location in geofence:", error);
    throw error;
  }
}

/**
 * Check if current time falls within the class schedule
 */
export function isWithinClassTime(
  classStartTime: Date,
  classEndTime: Date,
  currentTime: Date = new Date(),
): boolean {
  return currentTime >= classStartTime && currentTime <= classEndTime;
}

/**
 * Get the scheduled class for a room and current time
 */
export async function getScheduledClassAtTime(
  room_id: string,
  queryTime: Date = new Date(),
): Promise<any> {
  try {
    await connectDB();

    // Get day of week
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const currentDay = days[queryTime.getDay()];

    const schedule = await TimeTable.findOne({
      room_id,
      day: currentDay,
      start_time: { $lte: queryTime },
      end_time: { $gte: queryTime },
    })
      .populate("course_id")
      .lean()
      .exec();

    return schedule || null;
  } catch (error) {
    console.error("Error getting scheduled class:", error);
    return null;
  }
}

/**
 * Comprehensive attendance verification
 * Checks both location and time constraints
 */
export async function verifyAttendanceEligibility(
  room_id: string,
  student_latitude: number,
  student_longitude: number,
  currentTime: Date = new Date(),
): Promise<{
  eligible: boolean;
  location_verified: boolean;
  within_class_time: boolean;
  distance: number;
  scheduled_class: any;
  reason?: string;
}> {
  try {
    // Check location
    const locationResult = await verifyLocationInGeofence(
      room_id,
      student_latitude,
      student_longitude,
    );

    // Check scheduled class and time
    const scheduledClass = await getScheduledClassAtTime(room_id, currentTime);

    const isEligible = locationResult.isWithinGeofence && !!scheduledClass;

    // Get room for geofence radius info
    await connectDB();
    const room = await Room.findById(room_id).lean().exec();
    const roomData = room as any;

    return {
      eligible: isEligible,
      location_verified: locationResult.isWithinGeofence,
      within_class_time: !!scheduledClass,
      distance: Math.round(locationResult.distance),
      scheduled_class: scheduledClass,
      reason: !locationResult.isWithinGeofence
        ? `Student is ${Math.round(locationResult.distance)}m away from room (geofence: ${roomData?.geofence_radius || 50}m)`
        : !scheduledClass
          ? "No scheduled class at this time"
          : undefined,
    };
  } catch (error) {
    console.error("Error verifying attendance eligibility:", error);
    return {
      eligible: false,
      location_verified: false,
      within_class_time: false,
      distance: -1,
      scheduled_class: null,
      reason: "Verification failed",
    };
  }
}
