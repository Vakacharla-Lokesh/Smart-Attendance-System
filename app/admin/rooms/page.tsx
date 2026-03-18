"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Plus, Edit, Trash2, Search, MapPin, X } from "lucide-react";

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
  const [adminName, setAdminName] = useState("Admin User");
  const [adminEmail, setAdminEmail] = useState("admin@university.edu");

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
    const user = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (user) {
      const userData = JSON.parse(user);
      setAdminName(userData.name || "Admin User");
      setAdminEmail(userData.email || "admin@university.edu");
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
    if (!confirm(`Delete ${room.room_number}?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/rooms/${room._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#0b1a33] to-[#020617]">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  return (
    <AdminLayout adminName={adminName} adminEmail={adminEmail}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Room Management</h1>
            <p className="text-sm text-slate-400">
              Manage classroom locations and geofences
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowForm(true)}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-emerald-900/20 border-emerald-800">
          <AlertDescription className="text-emerald-400">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#020617] border-slate-700"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-[#0f172a]/80 border border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800">
                <tr className="text-left text-slate-400">
                  <th className="p-4">Room</th>
                  <th className="p-4">Building</th>
                  <th className="p-4">Floor</th>
                  <th className="p-4">Scanner</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Radius</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No rooms found
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room) => (
                    <tr
                      key={room._id}
                       className="border-b border-slate-800 hover:bg-slate-800/40 text-slate-300"
                    >
                      <td className="p-4 font-medium text-white">
                        {room.room_number}
                      </td>
                      <td className="p-4">{room.building}</td>
                      <td className="p-4">{room.floor}</td>
                      <td className="p-4">
                        <code className="text-xs bg-slate-800 px-2 py-1 rounded">
                          {room.scanner_id}
                        </code>
                      </td>
                      <td className="p-4 text-sm text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {room.latitude.toFixed(4)}, {room.longitude.toFixed(4)}
                      </td>
                      <td className="p-4">{room.geofence_radius}m</td>
                      <td className="p-4 flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(room)}>
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 text-sm text-slate-400">
        Showing {filteredRooms.length} of {rooms.length} rooms
      </div>

    </AdminLayout>
  );
}