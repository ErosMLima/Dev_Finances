window.addEventListener("DOMContentLoaded", start());

function start() {
  const Utils = {
    formatCurrency(value) {
      const signal = Number(value) < 0 ? "-" : "";

      const onlyDigitsInString = String(value).replace(/\D/g, "");
      const formatedValue = Number(onlyDigitsInString) / 100;
      const currency = formatedValue.toLocaleString("en-us", {
        style: "currency",
        currency: "USD",
      });

      return signal + currency;
    },
    sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    },

    formatAmount(value) {
      return Math.round(value * 100);
    },

    formatDate(date) {
      const [year, month, day] = date.split("-");
      return `${day}/${month}/${year}`;
    },
  };

  async function LoadingAppAnimation() {
    const timeline = new TimelineMax();
    timeline
      .fromTo(
        ".bg-loader",
        1,
        { width: "100%" },
        { width: "0%", delay: 5, ease: Expo.easeInOut }
      )
      .fromTo(
        "header",
        2,
        { width: "0%", opacity: 0 },
        { width: "100%", opacity: 1, ease: Expo.easeInOut },
        "-=1"
      )
      .fromTo(
        "main.container",
        0.7,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, ease: Expo.easeInOut },
        "-=0.5"
      )

      .fromTo(
        ".button.open-modal-download",
        0.7,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, ease: Expo.easeInOut },
        "-=0.5"
      )
      .fromTo(
        "footer p",
        0.7,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, ease: Expo.easeInOut },
        "-=0.5"
      );

    await Utils.sleep(8 * 1000);
    return;
  }

  function FormModalManipulation() {
    const ModalElement = document.querySelector(".modal-overlay.form");
    const openModalButton = document.querySelector(".button.new");
    const cancelModalUse = document.querySelector(".button.cancel.form");

    const ModalFunctions = {
      toggle: () => () => ModalElement.classList.toggle("active"),
    };

    openModalButton.addEventListener("click", ModalFunctions.toggle());
    cancelModalUse.addEventListener("click", ModalFunctions.toggle());
  }

  function Transactions() {
    const Storage = {
      get() {
        return (
          JSON.parse(localStorage.getItem("dev.finances:transactions")) || []
        );
      },

      set(transactions) {
        localStorage.setItem(
          "dev.finances:transactions",
          JSON.stringify(transactions)
        );
      },
    };

    const TransactionFunctions = {
      all: Storage.get(),

      add(transaction) {
        TransactionFunctions.all.push(transaction);

        App.reload();
      },

      remove(index) {
        const transaction = TransactionFunctions.all[index];

        TransactionFunctions.all.splice(index, 1);

        App.reload();
        return transaction;
      },

      incomes() {
        let income = 0;
        TransactionFunctions.all.forEach(({ amount }) => {
          if (amount > 0) income += amount;
        });

        return income;
      },

      expenses() {
        let expense = 0;
        TransactionFunctions.all.forEach(({ amount }) => {
          if (amount < 0) expense += amount;
        });

        return expense;
      },

      total() {
        return TransactionFunctions.incomes() + TransactionFunctions.expenses();
      },
    };

    const DOM = {
      transactionsContainer: document.querySelector("#data-table tbody"),

      addTransaction(transaction, index) {
        const tr = document.createElement("tr");
        tr.innerHTML = DOM.innerHtmlTransaction(transaction, index);
        tr.dataset.index = index;
        const image = tr.querySelector(`img#remove_${index}`);
        image.addEventListener("click", () => {
          const { description } = TransactionFunctions.remove(index);
          window.NotificateUser(`The transaction ${description} was deleted`);
          if (window.userAcceptedVoice) {
            window.notificateUserByVoice(
              `The transaction ${description} was deleted`
            );
          }
        });

        DOM.transactionsContainer.appendChild(tr);
      },

      innerHtmlTransaction({ description, amount, date }, index) {
        if (!description && !amount && !date) return "";
        const CSSClass = amount < 0 ? "expense" : "income";

        const formatedAmount = Utils.formatCurrency(amount);

        const html = `
                    <td class="description">${description}</td>
                    <td class="${CSSClass}">${formatedAmount}</td>
                    <td class="date">${date}</td>
                    <td>
                        <img src="./assets/minus.svg" alt="remover transação" id="remove_${index}" class="remove_transaction">
                    </td>
                `;

        return html;
      },

      updateBalance() {
        document.getElementById(
          "incomeDisplay"
        ).innerHTML = Utils.formatCurrency(TransactionFunctions.incomes());

        document.getElementById(
          "expenseDisplay"
        ).innerHTML = Utils.formatCurrency(TransactionFunctions.expenses());

        document.getElementById(
          "totalDisplay"
        ).innerHTML = Utils.formatCurrency(TransactionFunctions.total());
      },

      clearTransactions() {
        DOM.transactionsContainer.innerHTML = "";
      },
    };

    const App = {
      init() {
        TransactionFunctions.all.forEach(DOM.addTransaction);

        DOM.updateBalance();

        Storage.set(TransactionFunctions.all);
      },
      reload() {
        DOM.clearTransactions();
        App.init();
      },
    };

    window.APP = App;
    window.TransactionFunctions = TransactionFunctions;
  }

  function FormSubmitManipulation() {
    const descriptionInput = document.querySelector("input#description");
    const amountInput = document.querySelector("input#amount");
    const dateInput = document.querySelector("input#date");

    function getValues() {
      return {
        description: descriptionInput.value,
        amount: amountInput.value,
        date: dateInput.value,
      };
    }

    function validateFields() {
      const { description, amount, date } = getValues();
      if (
        description.trim() === "" ||
        amount.trim() === "" ||
        date.trim() === ""
      ) {
        throw new Error("Fill all the input data, Please!");
      }
    }

    function formatValues() {
      const { description, amount, date } = getValues();

      const formatedAmount = Utils.formatAmount(amount);
      const formatedDate = Utils.formatDate(date);

      return {
        description,
        amount: formatedAmount,
        date: formatedDate,
      };
    }

    function closeModal() {
      removeErrors();
      document.querySelector(".button.cancel.form").click();
    }

    async function showErrorToUser(error) {
      console.error(error);
      const errorContainer = document.querySelector(".input-group.error p");
      errorContainer.innerHTML = error;

      const errorLine = document.querySelector(".error-line");
      while (errorLine.style.width !== "100%") {
        const width = Number(errorLine.style.width.replace("%", ""));
        await Utils.sleep(1);
        errorLine.style.width = `${width + 1}%`;
      }
    }

    async function removeErrors() {
      const errorLine = document.querySelector(".error-line");
      errorLine.style.width = "0%";

      const errorContainer = document.querySelector(".input-group.error p");
      errorContainer.innerHTML = "";
    }

    function clearFields() {
      descriptionInput.value = "";
      amountInput.value = "";
      dateInput.value = "";
    }

    const formElement = document.querySelector("form");
    formElement.addEventListener("submit", (event) => {
      event.preventDefault();

      try {
        removeErrors();
        validateFields();
        const transaction = formatValues();
        window.TransactionFunctions.add(transaction);
        window.NotificateUser(
          `The transction ${transaction.description} was added`
        );
        if (window.userAcceptedVoice) {
          window.notificateUserByVoice(
            `The transaction ${transaction.description} was added`
          );
        }
        clearFields();
        closeModal();
      } catch (error) {
        showErrorToUser(error.message);
      }
    });
  }

  function DarkMode() {
    const darkModeCheckbox = document.querySelector("#switch");

    function changeText(hasDarkMode,showNotification=true) {
      const p = document.querySelector(".toggle p");
      p.textContent = hasDarkMode ? "Dark Mode" : "Light Mode";
      darkModeCheckbox.checked = p.textContent === "Dark Mode";
      if(!showNotification) return;
      window.NotificateUser(
        `Selectd Theme:${p.textContent || "Light Mode"}`
      );
      if (window.userAcceptedVoice) {
        window.notificateUserByVoice(
          `Selectd Theme:${p.textContent || "Light Mode"}`
        );
      }
    }

    const onChangeButton = () => {
      const html = document.querySelector("html");
      const hasDarkMode = html.classList.toggle("dark-mode");

      localStorage.setItem("dev.finances:mode", String(hasDarkMode));
      changeText(hasDarkMode);
    };

    const hasDarkMode =
      (localStorage.getItem("dev.finances:mode") || "false") === "false"
        ? false
        : true;

    changeText(hasDarkMode,false);
    if (hasDarkMode) onChangeButton();

    darkModeCheckbox.addEventListener("change", onChangeButton);
  }

  function Notifications(message) {
    if (!("Notification" in window)) return;
    if (!message) return;

    if (Notification.permission === "granted") {
      const notification = new Notification(message);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission((permission) => {
        if (permission === "granted") {
          const notification = new Notification(message);
        }
      });
    }
  }

  function SquaresAnimation() {
    const ulSquares = document.querySelector("ul.squares");
    const random = (min, max) => Math.random() * (max - min) + min;

    for (let squareIndex = 0; squareIndex <= 6; squareIndex++) {
      const li = document.createElement("li");

      const size = Math.floor(random(10, 120));
      const bottom = Math.floor(random(1, 20));
      const position = random(1, 99);
      const delay = random(5, 0.1);
      const duration = random(24, 12);

      li.style.width = `${size}px`;
      li.style.height = `${size}px`;
      li.style.bottom = `${bottom}px`;

      li.style.left = `${position}%`;

      li.style.animationDelay = `${delay}s`;
      li.style.animationDuration = `${duration}s`;
      li.style.animationTimingFunction = `cubic-bezier(${Math.random()},${Math.random()},${Math.random()},${Math.random()})`;

      ulSquares.appendChild(li);
    }
  }

  function DownloadJSON() {
    const downloadModal = document.querySelector(".modal-overlay.download");

    const downloadButton = document.querySelector(
      ".button.open-modal-download"
    );
    const closeModalButton = document.querySelector(".button.cancel-download");
    const saveJsonButton = document.querySelector(".button.download-json");

    function getText() {
      const array = [];
      window.TransactionFunctions.all.forEach(
        ({ amount, description, date }) => {
          const formatedAmount = Utils.formatCurrency(amount);
          array.push({ formatedAmount, description, date });
        }
      );

      array.push({
        incomes: Utils.formatCurrency(TransactionFunctions.incomes()),
        expenses: Utils.formatCurrency(TransactionFunctions.expenses()),
        total: Utils.formatCurrency(TransactionFunctions.total()),
      });

      return array;
    }

    downloadButton.addEventListener("click", () => {
      const transactionsInString = JSON.stringify(getText(), null, 4);

      downloadModal.classList.add("active");
      downloadModal.querySelector("pre").innerHTML = transactionsInString;
    });

    closeModalButton.addEventListener("click", () =>
      downloadModal.classList.remove("active")
    );

    saveJsonButton.addEventListener("click", () => {
      const transactionsInString = JSON.stringify(getText(), null, 4);
      const blobOfFile = new Blob([transactionsInString], {
        type: "application/json",
      });
      const anchora = document.createElement("a");
      anchora.href = window.URL.createObjectURL(blobOfFile);
      const filename = `transactions-${Date.now()}.json`;
      anchora.download = filename;

      document.body.appendChild(anchora);
      anchora.click();
      document.body.removeChild(anchora);

      downloadModal.classList.remove("active");
      window.NotificateUser(`O arquivo ${filename} foi baixado`);
      if (window.userAcceptedVoice) {
        window.notificateUserByVoice(`O arquivo json foi baixado`);
      }
    });
  }

  function VoiceNotificationsModalManipulation() {
    const voiceNotificationsModal = document.querySelector(
      ".modal-overlay.acessibility"
    );
    const userAlreadyUseThisApp =
      (localStorage.getItem("dev.finances:user_already_use_this_app") ||
        "false") === "true"
        ? true
        : false;
    if (userAlreadyUseThisApp) {
      window.userAcceptedVoice =
        (localStorage.getItem("dev.finances:voicenotifications") || "false") ===
        "true"
          ? true
          : false;
      return;
    }
    voiceNotificationsModal.classList.add("active");
    const cancelVoiceButton = voiceNotificationsModal.querySelector(
      ".button.cancel_voice"
    );
    const acceptVoiceButton = voiceNotificationsModal.querySelector(
      ".button.accept_voice"
    );
    const userHaveClicked = () => {
      localStorage.setItem("dev.finances:user_already_use_this_app", "true");
      voiceNotificationsModal.classList.remove("active");
    };

    cancelVoiceButton.addEventListener("click", () => {
      localStorage.setItem("dev.finances:voicenotifications", "false");
      window.userAcceptedVoice = false;

      userHaveClicked();
    });

    acceptVoiceButton.addEventListener("click", () => {
      localStorage.setItem("dev.finances:voicenotifications", "true");
      window.userAcceptedVoice = true;

      userHaveClicked();
    });
  }

  function VoiceNotifications(message) {
    if (!"speechSynthesis" in window) return;

    VoiceNotificationsModalManipulation();
    if (!window.userAcceptedVoice) return;

    // voice notification
    if(!message) return;
    
    const msg = new SpeechSynthesisUtterance();
    msg.text = message;
    msg.lang = "en";
    window.speechSynthesis.speak(msg);

    return;
  }

  return async () => {
    await LoadingAppAnimation();

    window.NotificateUser = Notifications;
    window.notificateUserByVoice = VoiceNotifications;
    
    VoiceNotifications();
    SquaresAnimation();
    DarkMode();
    Transactions();
    DownloadJSON();
    FormModalManipulation();
    FormSubmitManipulation();

    window.APP.init();
  };
}