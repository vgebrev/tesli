import { Component, OnInit } from '@angular/core';
import { CalendarEvent, CalendarEventTimesChangedEvent, CalendarEventTitleFormatter } from 'angular-calendar';
import { DayViewHourSegment, MonthViewDay } from 'calendar-utils';
import { Subject, of } from 'rxjs';
import { addHours, isSameMonth, isSameDay, parse, format, getTime, startOfHour, setHours, startOfMinute, getDate } from 'date-fns';
import { MatDialog } from '@angular/material/dialog';
import { LessonEditorComponent } from '../../lesson/lesson-editor/lesson-editor.component';
import { environment } from '../../../../environments/environment';
import { LessonService } from '../../../services/lesson.service';
import { LessonTitleFormatter } from './lesson-title-formatter.provider';
import { tap, catchError } from '../../../../../node_modules/rxjs/operators';
import { NotificationService } from '../../../services/notification.service';
import { Lesson } from '../../../model/lesson';

function isMonthViewDay(object: any): object is MonthViewDay {
  return object.hasOwnProperty('events');
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  providers: [
    { provide: CalendarEventTitleFormatter, useClass: LessonTitleFormatter }
  ]
})
export class CalendarComponent implements OnInit {
  isLoading = false;
  hoverItem = null;
  view = 'month';
  viewDate: Date = new Date();
  activeDayIsOpen = true;
  refresh: Subject<any> = new Subject();
  events: CalendarEvent[] = [];

  constructor(
    private lessonService: LessonService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.refresh.subscribe((newDate) => {
      this.viewDate = newDate;
      this.activeDayIsOpen = this.events.some((event) => isSameDay(event.start, this.viewDate) || isSameDay(event.end, this.viewDate));
    });
    this.getLessons();
  }

  getLessons() {
    this.isLoading = true;
    this.lessonService.getLessons()
      .pipe(
        tap(() => this.isLoading = false),
        catchError(() => {
          this.isLoading = false;
          this.notificationService.notification$.next({
            message: 'Unable to load lessons',
            action: 'Retry',
            config: { duration: 5000 },
            callback: () => this.getLessons()
          });
          return of([]);
        })
      ).subscribe((lessons: Array<Lesson>) => {
        this.events = lessons.map((lesson) => ({
          title: 'Lesson Title',
          start: parse(lesson.date),
          end: parse(format(lesson.date, `YYYY-MM-DD ${lesson.endTime}`)),
          draggable: true,
          resizable: {
            beforeStart: true,
            afterEnd: true
          },
          meta: lesson
        }));
      });
  }

  handleCalendarClick(evt, data: MonthViewDay|DayViewHourSegment) {
    if (evt.target.className.indexOf('cal-') === -1) {
      let date = data.date;
      if (isMonthViewDay(data)) {
        date = startOfHour(setHours(date, environment.defaultLessonStartHour));
      }
      this.addLesson(date);
    } else {
      if (isMonthViewDay(data)) {
        this.selectDay(data);
      }
    }
  }

  selectDay(day): void {
   const { date, events } = day;
    if (!isSameMonth(date, this.viewDate)) {
      return;
    }

    if (
      (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
      events.length === 0
    ) {
      this.activeDayIsOpen = false;
    } else {
      this.activeDayIsOpen = true;
      this.viewDate = date;
    }
  }

  changeEventTimes({
    event,
    newStart,
    newEnd
  }: CalendarEventTimesChangedEvent): void {
    if (!isSameDay(newStart, newEnd)) {
      return;
    }
    event.start = newStart;
    event.end = newEnd;
    event.title = format(newStart); // TODO: Figure out why custom title formatter only updates when title changes
    this.refresh.next(parse(format(newStart, 'YYYY-MM-DD')));
  }

  changeViewDate(newDate) {
    this.refresh.next(newDate);
  }

  addLesson(date: Date) {
    const startTime = startOfMinute(getTime(date));
    const dialogRef = this.dialog.open(LessonEditorComponent, {
      autoFocus: false,
      data: {
        date: date,
        startTime: format(startTime, 'HH:mm'),
        endTime: format(addHours(startTime, 1), 'HH:mm'),
        attendees: [],
        status: 'active'
      }});
    dialogRef.afterClosed().subscribe(lesson => {
      if (!lesson) { return; }
      this.events.push({
        title: 'Lesson Title',
        start: parse(lesson.date),
        end: parse(format(lesson.date, `YYYY-MM-DD ${lesson.endTime}`)),
        draggable: true,
        resizable: {
          beforeStart: true,
          afterEnd: true
        },
        meta: lesson
      });
      this.refresh.next(lesson.date);
    });
  }

  setHoverItem(item) {
    this.hoverItem = item;
  }

  clearHoverItem() {
    this.hoverItem = null;
  }
}
