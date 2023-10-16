import {
  Link,
  redirect,
  useNavigate,
  useParams,
  useSubmit,
  useNavigation,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchEvent, updateEvent, queryClient } from "../../util/http";
import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import ErrorBlock from "../UI/ErrorBlock";

export default function EditEvent() {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const submit = useSubmit();
  const params = useParams();

  const { data, isError, error } = useQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
    staleTime: 10000,
  });

  // const { mutate } = useMutation({
  //   mutationFn: updateEvent,
  //   //маніпуляція з кешованими даними, яку автоматично робить react query, а зараз робимо вручну
  //   onMutate: async (data) => {
  //     // data - дані, які змінив користувач і відправив на бекенд(тобто це formData)
  //     const newEvent = data.event;
  //     // скасування всіх активних запитів до певного ключа, щоб не було конфліктів з оптимістично оновленими даними (наступна строка)
  //     await queryClient.cancelQueries({ queryKey: ["events", params.id] });
  //     const previousEvent = queryClient.getQueryData(["events", params.id]); //зберігаємо старі данні на випадок виникнення помилки зі сторони бека

  //     queryClient.setQueryData(["events", params.id], newEvent); // оптимістично оновлені дані

  //     return { previousEvent };
  //   },

  //   onError: (error, data, context) => {
  //     // context contain previousEvent
  //     queryClient.setQueryData(["events", params.id], context.previousEvent);
  //   },
  //   onSettled: () => {
  //     //onSettled буде викликана щоразу коли буде виконуватись mutationFn, не залежно від відповіді (error or success)
  //     queryClient.invalidateQueries(["events", params.id]); //гарантує отримання останніх змін (з бека)
  //   },
  // });

  // function handleSubmit(formData) {
  //   mutate({ id: params.id, event: formData });
  //   navigate("../");
  // }

  function handleSubmit(formData) {
    submit(formData, { method: "PUT" });
  }

  function handleClose() {
    navigate("../");
  }

  let content;

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
        {state === "submitting" ? (
          <p>Sending data...</p>
        ) : (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Update
            </button>
          </>
        )}
      </EventForm>
    );
  }
  return <Modal onClose={handleClose}>{content}</Modal>;
}

// перед відображенням компонента EditEvent запуститься loader, тому isPending прибрали з компонента
export function loader({ params }) {
  //fetchQuery автоматично кешує отримані дані
  return queryClient.fetchQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
  });
}

//ця функція буде виконана коли відбудеться відправка форми
export async function action({ request, params }) {
  const formData = await request.formData();
  const updatedEventData = Object.fromEntries(formData);
  await updateEvent({ id: params.id, event: updatedEventData });
  await queryClient.invalidateQueries(["events"]); // в цьому випадку не буде оптимістично оновлені дані, це інший підхід
  return redirect("../");
}
