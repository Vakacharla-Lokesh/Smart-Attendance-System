"use client";

import { useState } from "react";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";

type AttendanceRecord = {
  id: string;
  name: string;
  course: string;
  enrollNo: string;
  status: "present" | "absent" | "leave";
};

const initialData: AttendanceRecord[] = [
  {
    id: "1",
    name: "Ravi Patel",
    course: "MBA",
    enrollNo: "101",
    status: "leave",
  },
  {
    id: "2",
    name: "Alice Johnson",
    course: "B.Tech CSE",
    enrollNo: "102",
    status: "leave",
  },
  {
    id: "3",
    name: "Ethan Hunt",
    course: "B.Sc Physics",
    enrollNo: "103",
    status: "leave",
  },
  {
    id: "4",
    name: "Julia Roberts",
    course: "B.Sc Maths",
    enrollNo: "104",
    status: "leave",
  },
  {
    id: "5",
    name: "George Miller",
    course: "MBA",
    enrollNo: "105",
    status: "leave",
  },
  {
    id: "6",
    name: "Kevin Hart",
    course: "B.Tech ECE",
    enrollNo: "106",
    status: "leave",
  },
  {
    id: "7",
    name: "Fiona Gallagher",
    course: "B.Com",
    enrollNo: "107",
    status: "leave",
  },
  {
    id: "8",
    name: "Diana Prince",
    course: "B.Tech IT",
    enrollNo: "108",
    status: "leave",
  },
  {
    id: "9",
    name: "Hannah Lee",
    course: "B.Tech CSE",
    enrollNo: "109",
    status: "leave",
  },
  {
    id: "10",
    name: "Ian Wright",
    course: "BBA",
    enrollNo: "110",
    status: "leave",
  },
  {
    id: "11",
    name: "Charlie Brown",
    course: "BBA",
    enrollNo: "111",
    status: "leave",
  },
  {
    id: "12",
    name: "Harsh Verma",
    course: "B.Tech IT",
    enrollNo: "112",
    status: "leave",
  },
  {
    id: "13",
    name: "Sophia Miller",
    course: "BBA",
    enrollNo: "113",
    status: "leave",
  },
  {
    id: "14",
    name: "Amit Sharma",
    course: "B.Sc Physics",
    enrollNo: "114",
    status: "leave",
  },
  {
    id: "15",
    name: "Olivia Brown",
    course: "B.Com",
    enrollNo: "115",
    status: "leave",
  },
  {
    id: "16",
    name: "Ravi Patel",
    course: "MBA",
    enrollNo: "116",
    status: "leave",
  },
  {
    id: "17",
    name: "Emily Davis",
    course: "B.Tech Civil",
    enrollNo: "117",
    status: "leave",
  },
  {
    id: "18",
    name: "Nikhil Mehra",
    course: "B.Tech CSE",
    enrollNo: "118",
    status: "leave",
  },
  {
    id: "19",
    name: "Grace Thompson",
    course: "B.Sc Maths",
    enrollNo: "119",
    status: "leave",
  },
  {
    id: "20",
    name: "Arjun Reddy",
    course: "B.Tech Mechanical",
    enrollNo: "120",
    status: "leave",
  },
  {
    id: "21",
    name: "Chloe Anderson",
    course: "BA English",
    enrollNo: "121",
    status: "leave",
  },
  {
    id: "22",
    name: "Manish Gupta",
    course: "B.Tech ECE",
    enrollNo: "122",
    status: "leave",
  },
  {
    id: "23",
    name: "Isabella Garcia",
    course: "B.Arch",
    enrollNo: "123",
    status: "leave",
  },
  {
    id: "24",
    name: "Rohit Yadav",
    course: "BBA",
    enrollNo: "124",
    status: "leave",
  },
  {
    id: "25",
    name: "Daniel Martinez",
    course: "M.Tech AI",
    enrollNo: "125",
    status: "leave",
  },
  {
    id: "26",
    name: "Priya Malhotra",
    course: "B.Sc Chemistry",
    enrollNo: "126",
    status: "leave",
  },
  {
    id: "27",
    name: "Liam Wilson",
    course: "LLB",
    enrollNo: "127",
    status: "leave",
  },
  {
    id: "28",
    name: "Sneha Iyer",
    course: "BA History",
    enrollNo: "128",
    status: "leave",
  },
  {
    id: "29",
    name: "Jack Robinson",
    course: "B.Tech IT",
    enrollNo: "129",
    status: "leave",
  },
  {
    id: "30",
    name: "Neha Chawla",
    course: "B.Sc Statistics",
    enrollNo: "130",
    status: "leave",
  },
  {
    id: "31",
    name: "Ethan Clark",
    course: "MBA",
    enrollNo: "131",
    status: "leave",
  },
  {
    id: "32",
    name: "Karan Singh",
    course: "B.Tech Civil",
    enrollNo: "132",
    status: "leave",
  },
  {
    id: "33",
    name: "Saanvi Desai",
    course: "B.Com",
    enrollNo: "133",
    status: "leave",
  },
  {
    id: "34",
    name: "Lucas Turner",
    course: "B.Tech CSE",
    enrollNo: "134",
    status: "leave",
  },
  {
    id: "35",
    name: "Ananya Banerjee",
    course: "B.Sc Biology",
    enrollNo: "135",
    status: "leave",
  },
  {
    id: "36",
    name: "Noah Harris",
    course: "B.Ed",
    enrollNo: "136",
    status: "leave",
  },
  {
    id: "37",
    name: "Aditya Joshi",
    course: "M.Tech Data Science",
    enrollNo: "137",
    status: "leave",
  },
  {
    id: "38",
    name: "Mia Scott",
    course: "B.Com",
    enrollNo: "138",
    status: "leave",
  },
  {
    id: "39",
    name: "Vikram Kulkarni",
    course: "B.Tech Mechanical",
    enrollNo: "139",
    status: "leave",
  },
  {
    id: "40",
    name: "Aarav Nair",
    course: "BBA",
    enrollNo: "140",
    status: "leave",
  },
  {
    id: "41",
    name: "Ella Rodriguez",
    course: "BA Psychology",
    enrollNo: "141",
    status: "leave",
  },
  {
    id: "42",
    name: "Kabir Bhatia",
    course: "B.Tech AI",
    enrollNo: "142",
    status: "leave",
  },
  {
    id: "43",
    name: "Madison Perez",
    course: "B.Tech Civil",
    enrollNo: "143",
    status: "leave",
  },
  {
    id: "44",
    name: "Ritika Sharma",
    course: "B.Sc Physics",
    enrollNo: "144",
    status: "leave",
  },
  {
    id: "45",
    name: "Benjamin Lee",
    course: "MBA",
    enrollNo: "145",
    status: "leave",
  },
  {
    id: "46",
    name: "Divya Kapoor",
    course: "B.Tech IT",
    enrollNo: "146",
    status: "leave",
  },
  {
    id: "47",
    name: "Oliver King",
    course: "B.Tech ECE",
    enrollNo: "147",
    status: "leave",
  },
  {
    id: "48",
    name: "Shreya Menon",
    course: "BA English",
    enrollNo: "148",
    status: "leave",
  },
  {
    id: "49",
    name: "Ryan Walker",
    course: "B.Com",
    enrollNo: "149",
    status: "leave",
  },
  {
    id: "50",
    name: "Tanya Agarwal",
    course: "M.Tech Cybersecurity",
    enrollNo: "150",
    status: "leave",
  },
  {
    id: "51",
    name: "Jayden Hill",
    course: "B.Sc Maths",
    enrollNo: "151",
    status: "leave",
  },
];

export default function Page() {
  const [data, setData] = useState<AttendanceRecord[]>(initialData);

  const updateStatus = (
    id: string,
    newStatus: "present" | "absent" | "leave"
  ) => {
    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status: newStatus } : row))
    );
  };

  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={createColumns(updateStatus)}
        data={data}
      />
    </div>
  );
}
