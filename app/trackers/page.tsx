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
  deleteDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Tracker } from "./../types";
import { v4 as uuidv4 } from "uuid";
import styles from "./style/trackers.module.css";

const TrackersPage = () => {
  const [today, setToday] = useState("");
  const [runningTrackers, setRunningTrackers] = useState<Tracker[]>([]);
  const [displayModal, setDisplayModal] = useState(false);
  const [trackerDescription, setDescription] = useState("");
  const [currentTracker, setCurrentTracker] = useState<Tracker | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);

  const auth = getAuth();
  const currentUser = auth.currentUser;
  let currentUserId: string;
  if (currentUser) {
    currentUserId = currentUser.uid;
  }

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
    const fetchData = async () => {
      try {
        const storedTrackers = JSON.parse(localStorage.getItem("runningTrackers") || "[]");
        setRunningTrackers(storedTrackers);
      } catch (error) {
        console.error("Error fetching running trackers:", error);
      }
    };

    fetchData();
  }, []);

  const fetchRunningTrackers = async () => {
    const db = getFirestore();
    const trackersCollection = collection(db, "trackers");

    const q = query(trackersCollection, where("finished", "==", false));
    const querySnapshot = await getDocs(q);

    const runningTrackers: Tracker[] = [];
    querySnapshot.forEach((doc) => {
      runningTrackers.push(doc.data() as Tracker);
    });

    return runningTrackers;
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const updatedTrackers = await Promise.all(
        runningTrackers.map(async (tracker) => {
          const elapsedTime = await calculateElapsedTime(tracker);
          updateLocalStorageElapsedtime(tracker.id, elapsedTime, tracker.description);
          return {
            ...tracker,
            elapsedTime: elapsedTime,
          };
        })
      );

      if (shouldSaveToFirestore()) {
        await saveEntriesToFirestore();
      }
  
      setRunningTrackers(updatedTrackers);
    }, 1000);

    return () => clearInterval(interval);
  }, [runningTrackers]);

  const shouldSaveToFirestore = () => {
    return true;
  };
  
  const saveEntriesToFirestore = async () => {
    const db = getFirestore();
    const trackersCollection = collection(db, "trackers");
  
    try {
      await Promise.all(
        runningTrackers.map(async (tracker) => {
          const { id, elapsedTime, description, entryDate, userId } = tracker;
          await setDoc(
            doc(trackersCollection, id.toString()),
            {
              elapsedTime,
              description,
              entryDate,
              userId,

            },
            { merge: true }
          );
        })
      );
  
      localStorage.setItem("lastSaveTime", new Date().toISOString());
    } catch (error) {
      console.error("Error saving entries to Firestore:", error);
    }
  };

  const updateLocalStorageElapsedtime = (trackerId: any, elapsedTime: number, description: string) => {
    const updatedTrackers = runningTrackers.map((tracker) =>
      tracker.id === trackerId
        ? {
            ...tracker,
            elapsedTime: elapsedTime,
          }
        : tracker
    );

    localStorage.setItem("runningTrackers", JSON.stringify(updatedTrackers));
  };

  const updateFirestoreElapsedtime = async (
    trackerId: number,
    elapsedTime: number,
    description: string
  ) => {
    const db = getFirestore();
    const trackersCollection = collection(db, "trackers");

    try {
      await setDoc(
        doc(trackersCollection, trackerId.toString()),
        {
          elapsedTime: elapsedTime,
          description: description,
          entryDate: today,
        },
        { merge: true }
      );
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

  const startNewTimer = () => {
    setDisplayModal(true);
    setDescription("");
  };

  const confirmStartTracker = () => {
    setRunningTrackers(
      (prevTrackers) =>
        prevTrackers.map((tracker) => ({
          ...tracker,
          paused: true,
        })) as Tracker[]
    );

    const newTracker = {
      id: uuidv4(),
      userId: currentUserId,
      name: `Tracker ${runningTrackers.length + 1}`,
      startTime: new Date().toISOString(),
      description: trackerDescription,
      elapsedTime: 0,
      paused: false,
      finished: false,
      entryDate: today,
    };

    setCurrentTracker(newTracker);
  setRunningTrackers((prevTrackers) => {
    const updatedTrackers = [...prevTrackers, newTracker];
    updateLocalStorageTrackers(updatedTrackers);
    return updatedTrackers;
  });
  setDisplayModal(false);
  };

  const updateLocalStorageTrackers = (updatedTrackers: Tracker[]) => {
    localStorage.setItem("runningTrackers", JSON.stringify(updatedTrackers));
  };

  const handleEditDescription = (tracker: Tracker) => {
    setSelectedTracker(tracker);
    setEditedDescription(tracker.description);
    setIsEditModalOpen(true);
  };

  const handleSaveDescription = async () => {
    try {
      if (selectedTracker) {
        const updatedTrackers = runningTrackers.map((tracker) =>
          tracker.id === selectedTracker.id
            ? {
                ...tracker,
                description: editedDescription,
              }
            : tracker
        );
  
        setRunningTrackers(updatedTrackers);
        updateLocalStorageTrackers(updatedTrackers);
  
        const db = getFirestore();
        const trackerDocRef = doc(db, "trackers", selectedTracker.id);
        await updateDoc(trackerDocRef, { description: editedDescription });
  
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving description:", error);
    }
  };

  const renderActionsColumn = (tracker: Tracker) => {
    return (
      <div>
        {!tracker.finished && (
          <>
            {tracker.paused ? (
              <Button
                icon="pi pi-play"
                rounded
                text
                style={{ color: "#FF5722" }}
                onClick={() => handleAction("resume", tracker)}
              />
            ) : (
              <Button
                icon="pi pi-pause"
                rounded
                text
                style={{ color: "#FF5722" }}
                onClick={() => handleAction("pause", tracker)}
              />
            )}

            <Button
              icon="pi pi-stop-circle"
              rounded
              text
              style={{ color: "#FF5722" }}
              onClick={() => handleAction("stop", tracker)}
            />
          </>
        )}
        <Button
                  icon="pi pi-pencil"
                  rounded
                  text
                  style={{ color: "#5F6B8A" }}
                  onClick={() => handleEditDescription(tracker)}
                />
        <Button
          icon="pi pi-trash"
          rounded
          text
          style={{ color: "#5F6B8A" }}
          onClick={() => handleAction("delete", tracker)}
        />
      </div>
    );
  };

  const removeTrackerFromLocalStorage = (trackerId: any) => {
    const updatedTrackers = runningTrackers.filter((tracker) => tracker.id !== trackerId);
    localStorage.setItem("runningTrackers", JSON.stringify(updatedTrackers));
  };

  const deleteTracker = async (trackerId: number) => {
    const db = getFirestore();
    const trackersCollection = collection(db, "trackers");

    try {
      await deleteDoc(doc(trackersCollection, trackerId.toString()));
      removeTrackerFromLocalStorage(trackerId);
    } catch (error) {
      console.error(`Error deleting tracker ${trackerId}`, error);
    }
  };

  const stopAll = () => {
    setRunningTrackers((prevTrackers) =>
      prevTrackers.map((tracker) => ({
        ...tracker,
        paused: true,
        finished: true,
      }))
    );
  };

  const handleAction = (action: string, tracker: Tracker) => {
    if (action === "delete") {
      setRunningTrackers((prevTrackers) =>
        prevTrackers.filter((t) => t.id !== tracker.id)
      );
      deleteTracker(tracker.id);
    }

    if (action === "pause") {
      setRunningTrackers((prevTrackers) =>
        prevTrackers.map((t) =>
          t.id === tracker.id
            ? {
                ...t,
                paused: true,
              }
            : t
        )
      );
    }

    if (action === "resume") {
      setRunningTrackers((prevTrackers) =>
        prevTrackers.map((t) =>
          t.id === tracker.id
            ? {
                ...t,
                paused: false,
              }
            : {
                ...t,
                paused: true,
              }
        )
      );

      updateFirestoreResume(tracker.id);
    }

    if (action === "stop") {
      setRunningTrackers((prevTrackers) =>
        prevTrackers.map((t) =>
          t.id === tracker.id
            ? {
                ...t,
                paused: true,
                finished: true,
              }
            : t
        )
      );
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
          finished: true,
          entryDate: today,
          userId: currentUserId,
        },
        { merge: true }
      );
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
          onClick={stopAll}
          className={styles.tracker_stop}
        />
      </div>

      {runningTrackers.length > 0 ? (
        <DataTable
          value={runningTrackers}
          className={styles.trackers_table}
          paginator
          rows={3}
        >
          <Column
            field="startTime"
            header="Time logged"
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
        <DataTable value={runningTrackers} className={styles.trackers_table}>
          <Column field="startTime" header="Time Logged"></Column>
          <Column field="description" header="Description"></Column>
          <Column header="Actions"></Column>
        </DataTable>
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
              value={trackerDescription}
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

      <Dialog
        header="Edit Description"
        visible={isEditModalOpen}
        style={{ width: "500px" }}
        className={styles.tracker_modal}
        onHide={() => setIsEditModalOpen(false)}
      >
        <div className={styles.tracker_modal_content}>
          <div className={styles.tracker_modal_fields}>
            <label>Description:</label>
            <InputTextarea
              autoResize
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={5}
            />
          </div>
          <div className={styles.tracker_modal_buttons}>
            <Button label="Save" onClick={handleSaveDescription} />
            <Button label="Cancel" onClick={() => setIsEditModalOpen(false)} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default TrackersPage;
