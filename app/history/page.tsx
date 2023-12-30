"use client";
import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  DocumentData,
} from "firebase/firestore";
import styles from "./style/history.module.css";

type Timer = {
  elapsedTime: number;
  description: string;
  id: string;
  entryDate: string;
};

const HistoryPage = () => {
  const [today, setToday] = useState("");
  const [previousTimers, setPreviousTimers] = useState<Timer[]>([]);

  useEffect(() => {
    const getFormattedDate = () => {
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear();

      return `${day}.${month}.${year}.`;
    };

    setToday(getFormattedDate());
  }, []);

  const fetchPreviousTimers = async () => {
    const db = getFirestore();
    const trackersCollection = collection(db, "trackers");

    const q = query(
      trackersCollection,
      orderBy("entryDate", "desc"),
      where("entryDate", "<", today)
    );

    const querySnapshot = await getDocs(q);

    const previousTimers: Timer[] = [];
    querySnapshot.forEach((doc) => {
      previousTimers.push(doc.data() as Timer);
    });

    return previousTimers;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timers = await fetchPreviousTimers();
        setPreviousTimers(timers);
      } catch (error) {
        console.error("Error fetching timers:", error);
      }
    };

    fetchData();
  }, [today]);

  return (
    <div className={styles.history_wrapper}>
      <h3>Trackers History</h3>
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
        </DataTable>
      ) : (
        <p>No previous timers available.</p>
      )}
    </div>
  );
};

export default HistoryPage;
