/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { createCardElement } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import { getCardList, getUserInfo, setUserInfo, setAvatarInfo, createNewCard, deleteCardFromServer, changeLike } from "./components/api.js";

const validationSettings = {
    formSelector: ".popup__form",
    inputSelector: ".popup__input",
    submitButtonSelector: ".popup__button",
    inactiveButtonClass: "popup__button_disabled",
    inputErrorClass: "popup__input_type_error",
    errorClass: "popup__error_visible"
};



// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const logoOfMesto = document.querySelector('.logo');
const infoModalWindow = document.querySelector('.popup_type_info');
const infoList = infoModalWindow.querySelector('.popup__info');
const popularCardsTitle = infoModalWindow.querySelector('.popup__text');
const popularCardsList = infoModalWindow.querySelector('.popup__list');

let user_Id = null;

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const changingButton = profileForm.querySelector('.popup__button');
  const savedText = changingButton.textContent;
  changingButton.textContent = 'Сохранение...';
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      changingButton.textContent = savedText;
    });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  const changingButton = avatarForm.querySelector('.popup__button');
  const savedText = changingButton.textContent;
  changingButton.textContent = 'Сохранение...';
  setAvatarInfo(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch(err => {
      console.log(err);
    })
    .finally(() => {
      changingButton.textContent = savedText;
    });
};


const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const changingButton = cardForm.querySelector('.popup__button');
  const savedText = changingButton.textContent;
  changingButton.textContent = 'Создание...';
  createNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
  .then((card) => {
    placesWrap.prepend(
    createCardElement(
      card,
      {
        onPreviewPicture: handlePreviewPicture,
        onLikeIcon: handleLikeCard,
        onDeleteCard: handleDeleteCard,
      }, user_Id)
  );

  closeModalWindow(cardFormModalWindow);
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  })
  .catch((err) => {
    console.log(err);
  })
  .finally(() => {
      changingButton.textContent = savedText;
  });
};

const handleDeleteCard = (cardElement, cardId) => {
  deleteCardFromServer(cardId)
    .then(() => {
      cardElement.remove();
    })
    .catch((err) => {
      console.error( err);
    });
};

const handleLikeCard = (likeButton, cardId, likeCount) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");
  changeLike(cardId, isLiked)
    .then((updatedCard) => {
      likeButton.classList.toggle("card__like-button_is-active");
      if (likeCount) {
        likeCount.textContent = updatedCard.likes.length;
      }
    })
    .catch((err) => {
      console.error(err);
    });
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleStatistics = () => {
  getCardList()
    .then((cards) => {
      infoList.innerHTML = ''; // очищаем от старого
      popularCardsList.innerHTML = '';
      const users = new Set();
      let totalLikes = 0;
      const userLikes = {};
      const cardLikes = [];
      cards.forEach(card => {
        users.add(card.owner.name);
        totalLikes += card.likes.length;
        card.likes.forEach(user => {
          userLikes[user.name] = (userLikes[user.name] || 0) + 1; //"||0" - проверка на то, что user`а ещё модет не быть в userLikes
        });
        cardLikes.push({
          name: card.name,
          likes: card.likes.length
        })
      });
      let championByLikes = '';
      let maxUserLikes = 0;
      Object.entries(userLikes).forEach(([userName, likes]) => {
        if (likes > maxUserLikes) {
          maxUserLikes = likes;
          championByLikes = userName;
        }
      });
      cardLikes.sort((a, b) => b.likes - a.likes); //оказывается просто sort в js работает из-под палки
      const template = document.querySelector('#popup-info-definition-template');
      const totalUsers = template.content.cloneNode(true);
      totalUsers.querySelector('.popup__info-term').textContent = 'Всего пользователей:';
      totalUsers.querySelector('.popup__info-description').textContent = users.size;
      infoList.appendChild(totalUsers);
      const sumLikes = template.content.cloneNode(true);
      sumLikes.querySelector('.popup__info-term').textContent = 'Всего лайков:';
      sumLikes.querySelector('.popup__info-description').textContent = totalLikes;
      infoList.appendChild(sumLikes);
      const maxLikes = template.content.cloneNode(true);
      maxLikes.querySelector('.popup__info-term').textContent = 'Максимально лайков от одного:';
      maxLikes.querySelector('.popup__info-description').textContent = maxUserLikes;
      infoList.appendChild(maxLikes);
      const champion = template.content.cloneNode(true);
      champion.querySelector('.popup__info-term').textContent = 'Чемпион лайков:';
      champion.querySelector('.popup__info-description').textContent = championByLikes;
      infoList.appendChild(champion);
      popularCardsTitle.textContent = 'Популярные карточки:';      
      const cardTemplate = document.querySelector('#popup-info-user-preview-template');
      cardLikes.slice(0, 3).forEach(card => {
        const cardItem = cardTemplate.content.cloneNode(true);
        const listItem = cardItem.querySelector('.popup__list-item');
        let displayName = card.name;
        if (displayName.length > 12) {
          displayName = displayName.substring(0, 12) + '...';
        }
        listItem.textContent = displayName;
        popularCardsList.appendChild(cardItem);
      });
      openModalWindow(infoModalWindow);
    })
    .catch((err) => {
      console.log(err);
  });
};

enableValidation(validationSettings);

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
logoOfMesto.addEventListener('click', handleStatistics);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

//настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

// ☆☆☆ :)

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    const user_Id = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    cards.forEach((info) => {
      placesWrap.append(
        createCardElement(info, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeCard,
          onDeleteCard: handleDeleteCard,
        }, user_Id)
      );
    });
  })
  .catch((err) => {
    console.log(err); // В случае возникновения ошибки выводим её в консоль
  });
