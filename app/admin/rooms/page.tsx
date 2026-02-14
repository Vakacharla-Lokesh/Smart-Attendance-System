"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Search,
  MapPin,
  X,
} from "lucide-react";

interface Room {
  _id: string;
  room_number: string;
  building: string;
  floor: string;
  scanner_id: string;
  latitude: number;
  longitude: number;
  geofence_radius: number;
}

export default function RoomManagement() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    room_number: "",
    building: "",
    floor: "",
    scanner_id: "",
    latitude: "",
    longitude: "",
    geofence_radius: "50",
  });

  useEffect(() => {
    checkAuth();
    fetchRooms();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [searchTerm, rooms]);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push("/home");
          return;
        }
        throw new Error("Failed to fetch rooms");
      }

      const data = await response.json();
      setRooms(data.rooms || []);
      setFilteredRooms(data.rooms || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    if (!searchTerm) {
      setFilteredRooms(rooms);
      return;
    }

    const filtered = rooms.filter(
      (room) =>
        room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.scanner_id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredRooms(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const url = editingRoom
        ? `/api/admin/rooms/${editingRoom._id}`
        : "/api/admin/rooms";
      const method = editingRoom ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          geofence_radius: parseInt(formData.geofence_radius),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Operation failed");
      }

      setSuccess(
        editingRoom ? "Room updated successfully" : "Room created successfully",
      );
      resetForm();
      fetchRooms();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      building: room.building,
      floor: room.floor,
      scanner_id: room.scanner_id,
      latitude: room.latitude.toString(),
      longitude: room.longitude.toString(),
      geofence_radius: room.geofence_radius.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`Are you sure you want to delete ${room.room_number}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/rooms/${room._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete room");
      }

      setSuccess("Room deleted successfully");
      fetchRooms();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      room_number: "",
      building: "",
      floor: "",
      scanner_id: "",
      latitude: "",
      longitude: "",
      geofence_radius: "50",
    });
    setEditingRoom(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Room Management</h1>
                <p className="text-sm text-gray-400">
                  Manage classroom locations and geofences
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Alerts */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-4"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-900/20 border-green-800">
            <AlertDescription className="text-green-400">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingRoom ? "Edit Room" : "Add New Room"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Room Number *</Label>
                      <Input
                        value={formData.room_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            room_number: e.target.value,
                          })
                        }
                        placeholder="A101"
                        required
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <Label>Building *</Label>
                      <Input
                        value={formData.building}
                        onChange={(e) =>
                          setFormData({ ...formData, building: e.target.value })
                        }
                        placeholder="Main Block"
                        required
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Floor *</Label>
                      <Input
                        value={formData.floor}
                        onChange={(e) =>
                          setFormData({ ...formData, floor: e.target.value })
                        }
                        placeholder="1"
                        required
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <Label>Scanner ID *</Label>
                      <Input
                        value={formData.scanner_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            scanner_id: e.target.value,
                          })
                        }
                        placeholder="SCANNER_001"
                        required
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Latitude *</Label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) =>
                          setFormData({ ...formData, latitude: e.target.value })
                        }
                        placeholder="28.6139"
                        required
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <Label>Longitude *</Label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            longitude: e.target.value,
                          })
                        }
                        placeholder="77.2090"
                        required
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Geofence Radius (meters) *</Label>
                    <Input
                      type="number"
                      value={formData.geofence_radius}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          geofence_radius: e.target.value,
                        })
                      }
                      placeholder="50"
                      required
                      className="bg-gray-800 border-gray-700"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Students must be within this radius to mark attendance
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600"
                    >
                      {editingRoom ? "Update Room" : "Create Room"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by room number, building, or scanner ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800"
            />
          </div>
        </div>

        {/* Rooms Table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-gray-400">
                      Room Number
                    </th>
                    <th className="p-4 font-medium text-gray-400">Building</th>
                    <th className="p-4 font-medium text-gray-400">Floor</th>
                    <th className="p-4 font-medium text-gray-400">
                      Scanner ID
                    </th>
                    <th className="p-4 font-medium text-gray-400">Location</th>
                    <th className="p-4 font-medium text-gray-400">Geofence</th>
                    <th className="p-4 font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-gray-400"
                      >
                        No rooms found. Click "Add Room" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredRooms.map((room) => (
                      <tr
                        key={room._id}
                        className="border-b border-gray-800 hover:bg-gray-800/50"
                      >
                        <td className="p-4 font-medium">{room.room_number}</td>
                        <td className="p-4">{room.building}</td>
                        <td className="p-4">{room.floor}</td>
                        <td className="p-4">
                          <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                            {room.scanner_id}
                          </code>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <MapPin className="w-3 h-3" />
                            {room.latitude.toFixed(4)},{" "}
                            {room.longitude.toFixed(4)}
                          </div>
                        </td>
                        <td className="p-4">{room.geofence_radius}m</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(room)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(room)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredRooms.length} of {rooms.length} rooms
        </div>
      </div>
    </div>
  );
}
