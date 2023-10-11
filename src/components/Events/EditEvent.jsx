import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { fetchEvent, updateEvent, queryClient } from "../../util/http";
import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import LoadingIndicator from "../UI/LoadingIndicator";
import ErrorBlock from "../UI/ErrorBlock";

export default function EditEvent() {
  const navigate = useNavigate();
  const params = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
  });

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    //маніпуляція з кешованими даними, яку автоматично робить react query, а зараз робимо вручну
    onMutate: async (data) => {
      // data - дані, які змінив користувач і відправив на бекенд(тобто це formData)
      const newEvent = data.event;
      // скасування всіх активних запитів до певного ключа, щоб не було конфліктів з оптимістично оновленими даними (наступна строка)
      await queryClient.cancelQueries({ queryKey: ["events", params.id] });
      const previousEvent = queryClient.getQueryData(["events", params.id]); //зберігаємо старі данні на випадок виникнення помилки зі сторони бека

      queryClient.setQueryData(["events", params.id], newEvent); // оптимістично оновлені дані

      return { previousEvent };
    },

    onError: (error, data, context) => {
      // context contain previousEvent
      queryClient.setQueryData(["events", params.id], context.previousEvent);
    },
    onSettled: () => {
      //onSettled буде викликана щоразу коли буде виконуватись mutationFn, не залежно від відповіді (error or success)
      queryClient.invalidateQueries(["events", params.id]); //гарантує отримання останніх змін (з бека)
    },
  });

  function handleSubmit(formData) {
    mutate({ id: params.id, event: formData });
    navigate("../");
  }

  function handleClose() {
    navigate("../");
  }

  let content;
  if (isPending) {
    content = (
      <div className="center">
        <LoadingIndicator />
      </div>
    );
  }

  if (isError) {
    content = (
      <>
        <ErrorBlock
          title="Failed to load event"
          massage={
            error.info?.message ||
            "Failed to load event. Please check your inputs and try again later."
          }
        />
        <div className="form-actions">
          <Link to="../" className="button">
            Okay
          </Link>
        </div>
      </>
    );
  }

  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        <Link to="../" className="button-text">
          Cancel
        </Link>
        <button type="submit" className="button">
          Update
        </button>
      </EventForm>
    );
  }
  return <Modal onClose={handleClose}>{content}</Modal>;
}
