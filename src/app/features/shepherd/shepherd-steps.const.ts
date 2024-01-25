import Step from 'shepherd.js/src/types/step';
import { ShepherdService } from 'angular-shepherd';
import { nextOnObs, twoWayObs, waitForEl } from './shepherd-helper';
import { LayoutService } from '../../core-ui/layout/layout.service';
import { TaskService } from '../tasks/task.service';
import { filter, first } from 'rxjs/operators';
import { promiseTimeout } from '../../util/promise-timeout';
import { Actions, ofType } from '@ngrx/effects';
import { addTask, deleteTask } from '../tasks/store/task.actions';
import { GlobalConfigState } from '../config/global-config.model';
import { hideAddTaskBar } from '../../core-ui/layout/store/layout.actions';

const NEXT_BTN = {
  classes: 'shepherd-button-primary',
  text: 'Next',
  type: 'next',
};

export const SHEPHERD_STANDARD_BTNS = [
  {
    classes: 'shepherd-button-secondary',
    text: 'Exit',
    type: 'cancel',
  },
  {
    classes: 'shepherd-button-primary',
    text: 'Back',
    type: 'back',
  },
  NEXT_BTN,
];

export const SHEPHERD_STEPS = (
  shepherdService: ShepherdService,
  cfg: GlobalConfigState,
  actions$: Actions,
  layoutService: LayoutService,
  taskService: TaskService,
): Array<Step.StepOptions> => [
  // TODO remove
  // {
  //   title: 'YXXXXO',
  //   // beforeShowPromise: () => promiseTimeout(200),
  //   when: {
  //     show: () => {
  //       setTimeout(() => {
  //         shepherdService.next();
  //       }, 500);
  //     },
  //   },
  //   buttons: [],
  // },
  // {
  //   title: 'Welcome to Super Productivity!!',
  //   text: 'Super Productivity is a ToDo app that helps you to improve your personal workflows.',
  //   buttons: SHEPHERD_STANDARD_BTNS,
  // },
  {
    attachTo: {
      element: '.action-nav button',
      on: 'bottom',
    },
    when: {
      show: () => {
        waitForEl('app-root > add-task-bar input', () => shepherdService.next());
      },
    },
    title: "Let's add your first task!",
    text: `Click on this button or press <kbd>${cfg.keyboard.addNewTask}</kbd>.`,
    advanceOn: {
      selector: '.action-nav button',
      event: 'click',
    },
  },

  {
    title: 'Enter a title!',
    text: 'Enter the title you want to give your task and hit the <kbd>Enter</kbd> key. After that you can press the <kbd>Escape</kbd> key or click anywhere on the grayed out backdrop to leave the add task bar.',
    attachTo: {
      element: 'add-task-bar',
      on: 'bottom',
    },
    ...twoWayObs(
      {
        obs: actions$.pipe(ofType(addTask)),
        cbAfter: () => layoutService.hideAddTaskBar(),
      },
      { obs: actions$.pipe(ofType(hideAddTaskBar)) },
      shepherdService,
    ),
  },
  {
    title: 'Congrats! This is your first task!',
    text: 'Hover over it with your mouse',
    attachTo: {
      element: 'task',
      on: 'bottom',
    },
    beforeShowPromise: () => promiseTimeout(400),
    when: {
      show: () => {
        setTimeout(() => {
          waitForEl('task .hover-controls', () => shepherdService.next());
        }, 1000);
      },
    },
  },
  {
    title: 'Start Tracking Time',
    attachTo: {
      element: '.start-task-btn',
      on: 'bottom',
    },
    text: 'Pressing the play button will start your first time tracking session. Time tracking is useful since it allows you to get a better idea on how you spend your time.',
    //   attachTo: {
    //     element: 'add-task-bar',
    //     on: 'bottom',
    //   },

    ...nextOnObs(taskService.currentTaskId$.pipe(filter((id) => !!id)), shepherdService),
  },
  {
    title: 'Stop Tracking Time',
    text: 'To stop tracking click on the pause button.',
    attachTo: {
      element: '.start-task-btn',
      on: 'bottom',
    },
    ...nextOnObs(taskService.currentTaskId$.pipe(filter((id) => !id)), shepherdService),
  },
  {
    title: 'Edit Task Title',
    text: 'You can edit the task title by clicking on it. Do this now and change the title to something else!',
    attachTo: {
      element: '.task-title',
      on: 'bottom',
    },
    advanceOn: {
      selector: '.task-title',
      event: 'blur',
    },
  },
  {
    title: 'Task Side Panel',
    text: 'There is more you you can do with task. Hover over the task you created with your mouse again.',
    buttons: [],
    attachTo: {
      element: 'task',
      on: 'bottom',
    },
    when: {
      show: () => {
        setTimeout(() => {
          waitForEl('task .hover-controls', () => shepherdService.next());
        }, 200);
      },
    },
  },
  {
    title: 'Opening Task Side Panel',
    attachTo: {
      element: '.show-additional-info-btn',
      on: 'bottom',
    },
    text: 'You can open a panel with additional controls by clicking on the button. Alternatively you can press the <kbd>➔</kbd> key when a task is focused.',
    buttons: [],
    ...nextOnObs(
      taskService.selectedTask$.pipe(filter((selectedTask) => !!selectedTask)),
      shepherdService,
    ),
  },
  {
    title: 'The Task Side Panel',
    text: 'In the task side panel you can adjust estimates, schedule your task, add a description or attachments or configure your task to be repeated.',
    buttons: [NEXT_BTN],
    beforeShowPromise: () => promiseTimeout(1000),
  },
  {
    title: 'Closing the Task Side Panel',
    text: 'You can close the panel by clicking the X or by pressing <kbd>←</kbd>. Do this now!',
    attachTo: {
      element: '.show-additional-info-btn',
      on: 'bottom',
    },
    ...nextOnObs(
      taskService.selectedTask$.pipe(filter((selectedTask) => !selectedTask)),
      shepherdService,
    ),
  },
  {
    title: 'Deleting a Task',
    // eslint-disable-next-line max-len
    text: `To delete a task you need to open the task context menu. To do so right click (or long press on Mac and Mobile) and select "Delete Task". Alternatively you can focus the task by clicking on it and pressing the <kbd>${cfg.keyboard.taskDelete}</kbd> key`,
    attachTo: {
      element: 'task',
      on: 'bottom',
    },
    when: {
      show: () => {
        setTimeout(() => {
          (document.querySelector('task') as HTMLElement)?.focus();
        }, 200);
        setTimeout(() => {
          (document.querySelector('task') as HTMLElement)?.focus();
        }, 1000);
        waitForEl('.mat-menu-panel', () => {
          shepherdService.hide();
        });
        actions$
          .pipe(ofType(deleteTask), first())
          .subscribe(() => shepherdService.next());
      },
    },
  },
  {
    title: 'These are the basics',
    text: 'Best',

    buttons: [],
  },
];