"use client";
import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import styles from "./style/history.module.css";
import { getAuth } from "firebase/auth";

type Timer = {
  elapsedTime: number;
  description: string;
  docId: string;
  entryDate: string;
};

const HistoryPage = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [previousTimers, setPreviousTimers] = useState<Timer[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [selectedTimer, setSelectedTimer] = useState<Timer | null>(null);

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
    
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      const currentUserId = currentUser.uid;
      q = query(q, where("userId", "==", currentUserId));
    } else {
      return [];
    }

    const querySnapshot = await getDocs(q);
  
    const previousTimers: Timer[] = [];
    querySnapshot.forEach((doc) => {
      previousTimers.push({ docId: doc.id, ...doc.data() } as Timer);
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

  const handleDelete = (timer: Timer) => {
    console.log('Deleting entry with ID:', timer.docId);
  };

  const handleEdit = (timer: Timer) => {
    setSelectedTimer(timer);
    setEditedDescription(timer.description);
    setIsEditModalOpen(true);
  };

  const handleSaveDescription = async () => {
    try {
      if (selectedTimer) {
        const db = getFirestore();
        const timerDocRef = doc(db, "trackers", selectedTimer.docId);
        await updateDoc(timerDocRef, { description: editedDescription });
        setIsEditModalOpen(false);
        handleFilterClick();
      }
    } catch (error) {
      console.error("Error saving description:", error);
    }
  };

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
          <Column
            body={(timer) => (
              <>
                <Button
                icon="pi pi-trash"
                rounded
                text
                style={{ color: "#5F6B8A" }}
                onClick={() => handleDelete(timer)} />
                <Button
                  icon="pi pi-pencil"
                  rounded
                text
                style={{ color: "#5F6B8A" }}
                  onClick={() => handleEdit(timer)} /></>
              
            )}
          ></Column>
        </DataTable>
      ) : (
        <p>No previous timers available.</p>
      )}
       <Dialog
        visible={isEditModalOpen}
        onHide={() => setIsEditModalOpen(false)}
        className={styles.edit_modal}
      >
        <h2>Edit description</h2>
        <InputTextarea
        autoResize
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
          rows={5}
        />
        <div className={styles.edit_modal_buttons}>
          <Button label="Save" onClick={handleSaveDescription} />
          <Button label="Cancel" onClick={() => setIsEditModalOpen(false)} />
        </div>
      </Dialog>
    </div>
  );
};

export default HistoryPage;
