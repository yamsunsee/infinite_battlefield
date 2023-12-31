import { useRef, useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { Form } from "../types";
import useStore from "../hooks/useStore";
import Icon from "../components/elements/Icon";
import Button from "../components/elements/Button";

const Login = () => {
  const navigate = useNavigate();
  const { dispatch } = useStore();
  const [form, setForm] = useState<Form>({
    serverUrl: "http://localhost:5000",
    playerName: "Yam",
    roomId: "ABC123",
  });
  const [isLoading, setIsLoading] = useState(false);
  const serverUrlRef = useRef<HTMLInputElement>(null);
  const roomIdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    serverUrlRef.current?.focus();
    const localData = sessionStorage.getItem("INFINITE_BATTLEFIELD");
    if (localData) {
      const localForm = JSON.parse(localData);
      setForm(localForm);
    }
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    const socket = io(form.serverUrl, {
      extraHeaders: {
        "ngrok-skip-browser-warning": "false",
      },
    });

    const toastId = toast(<Icon isLoading>Connecting to the server...</Icon>, {
      autoClose: false,
    });

    socket.on("connect_error", () => {
      toast.update(toastId, {
        render: (
          <>
            <div>Failed to connect to the server!</div>
            <div>Please make sure you provide a valid server URL!</div>
          </>
        ),
        type: "error",
        autoClose: 3000,
      });
      setForm((prevForm) => ({ ...prevForm, serverUrl: "" }));
      serverUrlRef.current?.focus();
      setIsLoading(false);
      socket.close();
    });

    socket.emit("SERVER", {
      type: "JOIN_ROOM",
      payload: { playerName: form.playerName, roomId: form.roomId },
    });

    socket.on("CLIENT", (action) => {
      const { type, payload } = action;

      switch (type) {
        case "NOTIFICATIONS":
          dispatch({ type: "SOCKET", payload: socket });
          dispatch({ type: "FORM", payload: form });
          dispatch({
            type: "ROOM",
            payload: payload.room,
          });
          toast.update(toastId, {
            render: "Successfully connected to the server!",
            type: "success",
            autoClose: 3000,
          });
          navigate("/");
          break;

        case "ERRORS":
          toast.update(toastId, {
            render: payload.message,
            type: "error",
            autoClose: 3000,
          });
          setForm((prevForm) => ({ ...prevForm, roomId: "" }));
          roomIdRef.current?.focus();
          setIsLoading(false);
          break;

        default:
          break;
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[url('/images/background.jpg')] bg-cover bg-no-repeat">
      <form
        onSubmit={handleSubmit}
        className="flex h-[50rem] w-[40rem] flex-col justify-between rounded-b-3xl border border-white/10 p-20 backdrop-blur-3xl before:absolute before:left-0 before:top-0 before:h-2 before:w-full before:bg-gradient-to-r before:from-theme before:via-indigo-500 before:to-red-300"
      >
        <h1 className="text-center text-6xl font-bold uppercase text-theme">Infinite Battlefield</h1>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="serverUrl" className="font-bold text-white">
              <Icon name="dns">Server URL</Icon>
            </label>
            <input
              required
              ref={serverUrlRef}
              className="input"
              placeholder="https://XXXX-XXX-XX-XX-XXX.ngrok-free.app"
              readOnly={isLoading}
              id="serverUrl"
              type="text"
              value={form.serverUrl}
              onChange={(event) => {
                setForm((prevForm) => ({
                  ...prevForm,
                  serverUrl: event.target.value,
                }));
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="playerName" className="font-bold text-white">
              <Icon name="person">Player Name</Icon>
            </label>
            <input
              required
              className="input"
              placeholder="Yamin"
              readOnly={isLoading}
              id="playerName"
              type="text"
              value={form.playerName}
              onChange={(event) => {
                setForm((prevForm) => ({
                  ...prevForm,
                  playerName: event.target.value,
                }));
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="roomId" className="font-bold text-white">
              <Icon name="meeting_room">Room ID</Icon>
            </label>
            <input
              required
              ref={roomIdRef}
              className="input"
              placeholder="ABC123"
              readOnly={isLoading}
              id="roomId"
              type="text"
              value={form.roomId}
              onChange={(event) => {
                setForm((prevForm) => ({
                  ...prevForm,
                  roomId: event.target.value,
                }));
              }}
            />
          </div>
        </div>
        <Button name="login" disabled={isLoading}>
          Join room
        </Button>
      </form>
    </div>
  );
};

export default Login;
