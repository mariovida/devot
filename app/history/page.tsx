"use client";
import React, { useEffect, useState } from "react";

import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import styles from "./style/history.module.css";

type Timer = {
  elapsedTime: number;
  description: string;
  id: string;
  entryDate: string;
};

const HistoryPage = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [previousTimers, setPreviousTimers] = useState<Timer[]>([]);

  const getFormattedDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}.`;
  };

  const fetchPreviousTimers = async () => {
    const db = getFirestore();
    const trackersCollection = collection(db, "trackers");

    let q = query(trackersCollection, orderBy("entryDate", "desc"));

    if (startDate) {
      q = query(q, where("entryDate", ">=", getFormattedDate(startDate)));
    }

    if (endDate) {
      q = query(q, where("entryDate", "<=", getFormattedDate(endDate)));
    }

    const querySnapshot = await getDocs(q);

    const previousTimers: Timer[] = [];
    querySnapshot.forEach((doc) => {
      previousTimers.push(doc.data() as Timer);
    });

    return previousTimers;
  };

  const handleFilterClick = async () => {
    try {
      const timers = await fetchPreviousTimers();
      setPreviousTimers(timers);
    } catch (error) {
      console.error("Error fetching timers:", error);
    }
  };

  useEffect(() => {
    handleFilterClick();
  }, []);

  return (
    <div className={styles.history_wrapper}>
      <h3>Trackers History</h3>
      <div className={styles.date_filters}>
        <div>
          <label>Start Date:</label>
          <Calendar
            value={startDate}
            onChange={(e) => setStartDate(e.value as Date)}
            showIcon
            dateFormat="dd.mm.yy"
          ></Calendar>
        </div>
        <div>
          <label>End Date:</label>
          <Calendar
            value={endDate}
            onChange={(e) => setEndDate(e.value as Date)}
            showIcon
            dateFormat="dd.mm.yy"
          ></Calendar>
        </div>
        <Button label="Filter" onClick={handleFilterClick} />
      </div>
      {previousTimers.length > 0 ? (
        <DataTable
          value={previousTimers}
          paginator
          rows={3}
          className={styles.history_table}
        >
          <Column
            field="entryDate"
            header="Date"
            body={(timer) => timer.entryDate.toString()}
          ></Column>
          <Column
            field="description"
            header="Description"
            body={(timer) => timer.description.toString()}
          ></Column>
          <Column
            header="Time Tracked"
            body={(timer) => {
              const hours = Math.floor(timer.elapsedTime / 3600);
              const minutes = Math.floor((timer.elapsedTime % 3600) / 60);
              const seconds = timer.elapsedTime % 60;

              const formattedTime = `${hours
                .toString()
                .padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

              return formattedTime;
            }}
          ></Column>
        </DataTable>
      ) : (
        <p>No previous timers available.</p>
      )}
    </div>
  );
};

export default HistoryPage;
