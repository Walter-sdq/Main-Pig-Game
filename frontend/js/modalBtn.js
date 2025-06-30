import { openModal, closeModal, loadAnim } from './uiHelpers.js';

const modalBtn = document.querySelector(".show-modal");
const modal = document.querySelector(".modal");
const overlay = document.querySelector(".modal-overlay");
const closeModalBtn = document.querySelector(".close-modal-btn");
const load = document.querySelector("#anim");

// Event Listeners
modalBtn.addEventListener("click", () => openModal(modal, overlay, modalBtn));
closeModalBtn.addEventListener("click", () => closeModal(modal, overlay));
overlay.addEventListener("click", () => closeModal(modal, overlay));
document.addEventListener("load", () => loadAnim(load, overlay));

