// src/scripts/components/validation.js

const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ\-\s]+$/;

const getInputConstraints = (input) => {
    if (input.classList.contains('popup__input_type_name')) {
        return { min: 2, max: 40 };
    }
    if (input.classList.contains('popup__input_type_card-name')) {
        return { min: 2, max: 30 };
    }
    if (input.classList.contains('popup__input_type_description')) {
        return { min: 2, max: 200 };
    }
    return { min: 0, max: Infinity };
};

const isInputValid = (input) => {
    if (!input.value.trim()) {
        return false;
    }

    const isNameField = input.classList.contains('popup__input_type_name') ||
                       input.classList.contains('popup__input_type_description') ||
                       input.classList.contains('popup__input_type_card-name');

    if (isNameField) {
        const constraints = getInputConstraints(input);
        
        if (input.value.length < constraints.min) {
            return false;
        }
        
        if (input.value.length > constraints.max) {
            return false;
        }
        
        if (!NAME_REGEX.test(input.value)) {
            return false;
        }
    }
  
    return true;
};

const showInputError = (form, input, errorMessage, settings) => {
    const errorElement = document.querySelector(`#${input.id}-error`);
    
    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.add(settings.errorClass);
    }
    
    input.classList.add(settings.inputErrorClass);
};

const hideInputError = (form, input, settings) => {
    const errorElement = document.querySelector(`#${input.id}-error`);
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove(settings.errorClass);
    }
    
    input.classList.remove(settings.inputErrorClass);
};

const checkInputValidity = (form, input, settings) => {
    if (isInputValid(input)) {
        hideInputError(form, input, settings);
        return true;
    }

    let errorMessage = '';

    if (!input.value.trim()) {
        errorMessage = 'Это обязательное поле';
    } else if (input.dataset.errorMessage && !NAME_REGEX.test(input.value)) {
        errorMessage = input.dataset.errorMessage;
    } else if (input.type === 'url') {
        errorMessage = 'Введите корректную ссылку (начинается с http:// или https://)';
    } else {
        const constraints = getInputConstraints(input);
        
        if (input.value.length < constraints.min) {
            errorMessage = `Минимальная длина: ${constraints.min} символа`;
        } else if (input.value.length > constraints.max) {
            errorMessage = `Максимальная длина: ${constraints.max} символов`;
        } else {
            errorMessage = 'Поле заполнено некорректно';
        }
    }

    showInputError(form, input, errorMessage, settings);
    return false;
};

const hasInvalidInput = (inputList) => {
    return Array.from(inputList).some(input => !isInputValid(input));
};

const disableSubmitButton = (button, settings) => {
    button.classList.add(settings.inactiveButtonClass);
    button.disabled = true;
};

const enableSubmitButton = (button, settings) => {
    button.classList.remove(settings.inactiveButtonClass);
    button.disabled = false;
};

const toggleButtonState = (inputList, button, settings) => {
    const allValid = Array.from(inputList).every(input => isInputValid(input));
    
    console.log('toggleButtonState: allValid =', allValid);
    console.log('Кнопка до:', button.classList.contains(settings.inactiveButtonClass));
    
    if (allValid) {
        button.classList.remove(settings.inactiveButtonClass);
        button.disabled = false;
    } else {
        button.classList.add(settings.inactiveButtonClass);
        button.disabled = true;
    }
};

const setEventListeners = (form, settings) => {
    const inputList = form.querySelectorAll(settings.inputSelector);
    const button = form.querySelector(settings.submitButtonSelector);

    toggleButtonState(inputList, button, settings);

    inputList.forEach(input => {
        input.addEventListener('input', () => {
            checkInputValidity(form, input, settings);
            toggleButtonState(inputList, button, settings);
        });
    });

    form.addEventListener('submit', (evt) => {
        evt.preventDefault();
    });
};

export const clearValidation = (form, settings) => {
    const inputList = form.querySelectorAll(settings.inputSelector);
    const button = form.querySelector(settings.submitButtonSelector);

    inputList.forEach(input => {
        hideInputError(form, input, settings);
    });

    disableSubmitButton(button, settings);
};

export const enableValidation = (settings) => {
    const formList = document.querySelectorAll(settings.formSelector);

    formList.forEach(form => {
        setEventListeners(form, settings);
    });
};