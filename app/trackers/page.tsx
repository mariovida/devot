"use client";
import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  setDoc,
  doc,
  getDoc,
  DocumentData,
} from "firebase/firestore";
import styles from "./style/trackers.module.css";

type Tracker = {
  id: number;
  name: string;
  startTime: string;
  description: string;
  elapsedTime: number;
  paused: boolean;
};

const TrackersPage = () => {
  const [today, setToday] = useState("");
  const [runningTrackers, setRunningTrackers] = useState<Tracker[]>([]);
  const [displayModal, setDisplayModal] = useState(false);
  const [description, setDescription] = useState("");
  const [currentTracker, setCurrentTracker] = useState<Tracker | null>(null);

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

  useEffect(() => {
    const interval = setInterval(async () => {
      const updatedTrackers = await Promise.all(
        runningTrackers.map(async (tracker) => {
          const elapsedTime = await calculateElapsedTime(tracker);
          updateFirestoreElapsedtime(tracker.id, elapsedTime);
          return {
            ...tracker,
            elapsedTime: elapsedTime,
          };
        })
      );

      setRunningTrackers(updatedTrackers);
    }, 1000);

    return () => clearInterval(interval);
  }, [runningTrackers]);

  const updateFirestoreElapsedtime = async (
    trackerId: number,
    elapsedTime: number
  ) => {
    const db = getFirestore();
    const trackersCollection = collection(db, "trackers");

    try {
      await setDoc(
        doc(trackersCollection, trackerId.toString()),
        {
          elapsedTime: elapsedTime,
        },
        { merge: true }
      );
      console.log(`Elapsed time updated for tracker ${trackerId}`);
    } catch (error) {
      console.error(
        `Error updating elapsed time for tracker ${trackerId}`,
        error
      );
    }
  };

  const calculateElapsedTime = async (tracker: Tracker) => {
    const currentTime = new Date();
    const startTimeObj = new Date(tracker.startTime);

    let elapsedTime;

    if (tracker.paused) {
      elapsedTime = tracker.elapsedTime;
    } else {
      elapsedTime = tracker.elapsedTime + 1;
    }

    return Promise.resolve(elapsedTime);
  };

  const formatElapsedTime = (tracker: Tracker) => {
    const elapsedTime = tracker.elapsedTime;

    const seconds = elapsedTime % 60;
    const minutes = Math.floor(elapsedTime / 60) % 60;
    const hours = Math.floor(elapsedTime / (60 * 60));

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const fetchFirestoreElapsedTime = async (
    trackerId: number
  ): Promise<number | null> => {
    const db = getFirestore();
    const trackersCollection = collection(db, "trackers");

    try {
      const trackerDoc = await getDoc(
        doc(trackersCollection, trackerId.toString())
      );
      const trackerData = trackerDoc.data() as DocumentData;

      return trackerData && trackerData.elapsedTime
        ? trackerData.elapsedTime
        : null;
    } catch (error) {
      console.error(
        `Error fetching elapsed time for tracker ${trackerId}`,
        error
      );
      return null;
    }
  };

  const startNewTimer = () => {
    setDisplayModal(true);
  };

  const confirmStartTracker = () => {
    const newTracker = {
      id: runningTrackers.length + 1,
      name: `Tracker ${runningTrackers.length + 1}`,
      startTime: new Date().toISOString(),
      description: description,
      elapsedTime: 0,
      paused: false,
    };

    setCurrentTracker(newTracker);
    setRunningTrackers((prevTrackers) => [...prevTrackers, newTracker]);
    setDisplayModal(false);
  };

  const syncDataWithFirestore = async () => {
    const db = getFirestore();

    try {
      const trackersCollection = collection(db, "trackers");

      await addDoc(trackersCollection, {
        timestamp: serverTimestamp(),
        runningTrackers,
      });
    } catch (error) {
      console.error("Error syncing data with Firestore", error);
    }
  };

  const renderActionsColumn = (tracker: Tracker) => {
    return (
      <div>
        {tracker.paused ? (
          <Button
            label="Resume"
            onClick={() => handleAction("resume", tracker)}
          />
        ) : (
          <Button
            label="Pause"
            onClick={() => handleAction("pause", tracker)}
          />
        )}
        <Button label="Stop" onClick={() => handleAction("stop", tracker)} />
        {/* <Button label="Edit" onClick={() => handleAction("edit", tracker)} /> */}
        <Button
          label="Delete"
          onClick={() => handleAction("delete", tracker)}
        />
      </div>
    );
  };

  const handleAction = (action: string, tracker: Tracker) => {
    if (action === "delete") {
      setRunningTrackers((prevTrackers) =>
        prevTrackers.filter((tracker) => tracker.id !== tracker.id)
      );
    }

    if (action === "pause") {
      setRunningTrackers((prevTrackers) =>
        prevTrackers.map((tracker) =>
          tracker.id === tracker.id
            ? {
                ...tracker,
                paused: true,
              }
            : tracker
        )
      );
    }

    if (action === "resume") {
      setRunningTrackers((prevTrackers) =>
        prevTrackers.map((tracker) =>
          tracker.id === tracker.id
            ? {
                ...tracker,
                paused: false,
              }
            : tracker
        )
      );

      updateFirestoreResume(tracker.id);
    }
  };

  const updateFirestoreResume = async (trackerId: number) => {
    const db = getFirestore();
    const trackersCollection = collection(db, "trackers");

    try {
      await setDoc(
        doc(trackersCollection, trackerId.toString()),
        {
          paused: false,
        },
        { merge: true }
      );
      console.log(`Tracker ${trackerId} resumed in Firestore`);
    } catch (error) {
      console.error(
        `Error updating resume status for tracker ${trackerId}`,
        error
      );
    }
  };

  return (
    <div className={styles.trackers_wrapper}>
      <h3>Today ({today})</h3>

      <div className={styles.tracker_buttons}>
        <Button
          label="Start new timer"
          onClick={startNewTimer}
          className={styles.tracker_start}
        />
        <Button
          label="Stop all"
          onClick={startNewTimer}
          className={styles.tracker_stop}
        />
      </div>

      {runningTrackers.length > 0 ? (
        <DataTable value={runningTrackers} className={styles.trackers_table}>
          <Column
            field="startTime"
            header="Time Logged"
            body={(tracker) => formatElapsedTime(tracker)}
          ></Column>
          <Column
            field="description"
            header="Description"
            body={(tracker) => tracker.description}
          ></Column>

          <Column body={renderActionsColumn} header="Actions"></Column>
        </DataTable>
      ) : (
        <p>No trackers currently running.</p>
      )}

      <Dialog
        header="New tracker"
        visible={displayModal}
        style={{ width: "500px" }}
        className={styles.tracker_modal}
        onHide={() => setDisplayModal(false)}
      >
        <div className={styles.tracker_modal_content}>
          <div className={styles.tracker_modal_fields}>
            <label>Description:</label>
            <InputTextarea
              autoResize
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
          <div className={styles.tracker_modal_buttons}>
            <Button label="Confirm" onClick={confirmStartTracker} />
            <Button label="Cancel" onClick={() => setDisplayModal(false)} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default TrackersPage;
